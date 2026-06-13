const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function buildWhere(query) {
  if (!query || Object.keys(query).length === 0) return {};
  const where = { ...query };
  
  for (const key in where) {
    if (key === '_id') {
      where.id = String(where[key]);
      delete where._id;
      continue;
    }
    if (key === 'id' && typeof where[key] !== 'object') {
       where.id = String(where.id);
       continue;
    }
    
    // Tratamento para operadores do tipo MongoDB / Sequelize
    const val = where[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof RegExp)) {
      const prismaOp = {};
      let hasOp = false;
      if (val.$like !== undefined) {
        let likeStr = val.$like;
        if (likeStr.endsWith('%') && !likeStr.startsWith('%')) {
          prismaOp.startsWith = likeStr.slice(0, -1);
        } else if (likeStr.startsWith('%') && likeStr.endsWith('%')) {
          prismaOp.contains = likeStr.slice(1, -1);
        } else {
          prismaOp.contains = likeStr.replace(/%/g, '');
        }
        prismaOp.mode = 'insensitive';
        hasOp = true;
      }
      if (val.$regex !== undefined) {
         prismaOp.contains = val.$regex.source || val.$regex; 
         prismaOp.mode = 'insensitive';
         hasOp = true;
      }
      if (val.$ne !== undefined) {
        prismaOp.not = val.$ne;
        hasOp = true;
      }
      if (val.$in !== undefined) {
        prismaOp.in = val.$in;
        hasOp = true;
      }
      if (val.$gte !== undefined) {
        prismaOp.gte = val.$gte;
        hasOp = true;
      }
      if (val.$lte !== undefined) {
        prismaOp.lte = val.$lte;
        hasOp = true;
      }
      if (val.$gt !== undefined) {
        prismaOp.gt = val.$gt;
        hasOp = true;
      }
      if (val.$lt !== undefined) {
        prismaOp.lt = val.$lt;
        hasOp = true;
      }

      if (hasOp) {
        where[key] = prismaOp;
      }
    } else if (val instanceof RegExp) {
      // Expressões regulares diretas passadas do Mongoose
      let source = val.source;
      if (source.startsWith('^') && source.endsWith('$')) {
        where[key] = { equals: source.slice(1, -1), mode: 'insensitive' };
      } else if (source.startsWith('^')) {
        where[key] = { startsWith: source.slice(1), mode: 'insensitive' };
      } else {
        where[key] = { contains: source, mode: 'insensitive' };
      }
    }
  }

  if (where.$or) {
    where.OR = where.$or.map(cond => buildWhere(cond));
    delete where.$or;
  }
  if (where.$and) {
    where.AND = where.$and.map(cond => buildWhere(cond));
    delete where.$and;
  }

  return where;
}

// Wrapper flexível para tornar o Prisma Client parecido com Mongoose,
// retornando objetos com método save() para compatibilidade e lidando com async chaining.
class PrismaCollectionProxy {
  constructor(modelName) {
    this.modelName = modelName;
    this.model = prisma[modelName];
  }

  // Envolve um ou mais docs em um objeto que tenha os métodos toObject e save
  wrapDoc(doc) {
    if (!doc) return null;
    if (Array.isArray(doc)) return doc.map(d => this.wrapDoc(d));
    
    const self = this;
    const wrapped = {
      ...doc,
      _id: doc.id, // Retro-compatibilidade com código que usa doc._id
      toObject: function() { 
         const obj = { ...this };
         delete obj.save;
         delete obj.toObject;
         return obj;
      },
      save: async function() {
        const dataToSave = { ...this };
        delete dataToSave.save;
        delete dataToSave.toObject;
        delete dataToSave._id; // _id não existe no Prisma nativamente
        delete dataToSave.createdAt; // Geralmente auto-gerenciado ou não atualizável diretamente
        delete dataToSave.updatedAt;

        const updated = await self.model.update({
          where: { id: this.id },
          data: dataToSave
        });
        
        return self.wrapDoc(updated);
      }
    };
    return wrapped;
  }

  find(query = {}) {
    const self = this;
    const whereClause = buildWhere(query);
    
    const chain = {
      _options: {
        where: whereClause,
      },
      sort: function(options) {
        this._options.orderBy = Object.keys(options).map(key => ({
          [key]: options[key] === 1 ? 'asc' : 'desc'
        }));
        return this;
      },
      select: function(fields) {
        // Ignorado no wrapper simples
        return this;
      },
      limit: function(n) {
        this._options.take = n;
        return this;
      },
      then: function(resolve, reject) {
        self.model.findMany(this._options)
          .then(results => resolve(self.wrapDoc(results)))
          .catch(reject);
      },
      catch: function(reject) {
        self.model.findMany(this._options).catch(reject);
      }
    };

    return chain;
  }

  async findOne(query = {}) {
    const doc = await this.model.findFirst({ where: buildWhere(query) });
    return this.wrapDoc(doc);
  }

  async findById(id) {
    const doc = await this.model.findUnique({ where: { id: String(id) } });
    return this.wrapDoc(doc);
  }

  async create(data) {
    const dataToSave = { ...data };
    delete dataToSave._id; // Limpa _id se houver
    const doc = await this.model.create({ data: dataToSave });
    return this.wrapDoc(doc);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    try {
      const dataToSave = { ...update };
      delete dataToSave._id;
      delete dataToSave.id;

      const doc = await this.model.update({
        where: { id: String(id) },
        data: dataToSave
      });
      return this.wrapDoc(doc);
    } catch (e) {
      if (e.code === 'P2025') return null; // Record to update not found
      throw e;
    }
  }

  async findByIdAndDelete(id) {
    try {
      const doc = await this.model.delete({ where: { id: String(id) } });
      return this.wrapDoc(doc);
    } catch (e) {
      if (e.code === 'P2025') return null; // Record to delete not found
      throw e;
    }
  }

  async deleteMany(query = {}) {
    return await this.model.deleteMany({ where: buildWhere(query) });
  }

  async countDocuments(query = {}) {
    return await this.model.count({ where: buildWhere(query) });
  }

  async insertMany(docs) {
    const data = docs.map(d => {
      const c = { ...d };
      delete c._id;
      return c;
    });
    return await this.model.createMany({ data });
  }
}

// Wrapper para simular const model = new Model(data)
function createProxy(modelName) {
  const instance = new PrismaCollectionProxy(modelName);
  
  const proxy = function(data) {
    const doc = { ...data };
    if (!doc.id) {
      // Prisma usará uuid, ou podemos deixar Prisma gerar
    }
    return instance.wrapDoc(doc);
  };
  
  const methods = [
    'find', 'findOne', 'findById', 'create', 
    'findByIdAndUpdate', 'findByIdAndDelete', 
    'deleteMany', 'countDocuments', 'insertMany'
  ];
  
  methods.forEach(m => {
    proxy[m] = instance[m].bind(instance);
  });
  
  return proxy;
}

module.exports = {
  Padeiro: createProxy('padeiro'),
  Produto: createProxy('produto'),
  Cliente: createProxy('cliente'),
  Colaborador: createProxy('colaborador'),
  Admin: createProxy('admin'),
  Meta: createProxy('meta'),
  Atividade: createProxy('atividade'),
  Avaliacao: createProxy('avaliacao'),
  Cronograma: createProxy('cronograma'),
  Criterio: createProxy('criterio'),
  Localizacao: createProxy('localizacao'),
  HistoricoLocalizacao: createProxy('historicoLocalizacao'),
  CronogramaTemplate: createProxy('cronogramaTemplate'),
  TimelineEvent: createProxy('timelineEvent'),
  PushSubscription: createProxy('pushSubscription'),
  Configuracao: createProxy('configuracao')
};
