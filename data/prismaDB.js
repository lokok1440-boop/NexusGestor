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
    
    // Handling string exact match for scalar list fields
    if (key === 'filial' && typeof where[key] === 'string') {
      where[key] = { has: where[key] };
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
        if (key === 'filial') {
          prismaOp.hasSome = val.$in;
        } else {
          prismaOp.in = val.$in;
        }
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

const modelFieldTypes = {
  padeiro: {
    booleans: ['ativo', 'deletado']
  },
  padeiroMeta: {
    ints: ['metaPaoSal', 'metaPaoDoce', 'metaPaoForma', 'metaRosca', 'metaSalgado', 'metaPaoQueijo', 'metaIntegral']
  },
  atividade: {
    floats: ['nota'],
    ints: [
      'prodPaoSal', 'prodPaoDoce', 'prodPaoForma', 'prodRosca', 'prodSalgado', 'prodPaoQueijo', 'prodIntegral',
      'perdaPaoSal', 'perdaPaoDoce', 'perdaPaoForma', 'perdaRosca', 'perdaSalgado', 'perdaPaoQueijo', 'perdaIntegral'
    ]
  },
  cronograma: {
    ints: ['tempoMinimoMinutos', 'posicao']
  },
  localizacao: {
    floats: ['lat', 'lng', 'precisao']
  },
  produto: {
    floats: ['preco'],
    booleans: ['ativo']
  },
  cliente: {
    booleans: ['ativo']
  },
  avaliacao: {
    floats: ['nota']
  }
};

function coerceFields(modelName, data) {
  if (!data || typeof data !== 'object') return data;
  const types = modelFieldTypes[modelName];
  if (!types) return data;

  const coerced = { ...data };

  if (types.ints) {
    for (const field of types.ints) {
      if (coerced[field] !== undefined) {
        if (coerced[field] === null || coerced[field] === '') {
          coerced[field] = null;
        } else {
          const val = parseInt(coerced[field], 10);
          coerced[field] = isNaN(val) ? null : val;
        }
      }
    }
  }

  if (types.floats) {
    for (const field of types.floats) {
      if (coerced[field] !== undefined) {
        if (coerced[field] === null || coerced[field] === '') {
          coerced[field] = null;
        } else {
          const val = parseFloat(coerced[field]);
          coerced[field] = isNaN(val) ? null : val;
        }
      }
    }
  }

  if (types.booleans) {
    for (const field of types.booleans) {
      if (coerced[field] !== undefined) {
        if (coerced[field] === null || coerced[field] === '') {
          coerced[field] = null;
        } else {
          coerced[field] = coerced[field] === 'true' || coerced[field] === 'on' || coerced[field] === true || coerced[field] === '1';
        }
      }
    }
  }

  return coerced;
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
         delete obj.toJSON;
         return obj;
      },
      toJSON: function() {
         return this.toObject();
      },
      save: async function() {
        const dataToSave = coerceFields(self.modelName, { ...this });
        delete dataToSave.save;
        delete dataToSave.toObject;
        delete dataToSave.toJSON;
        delete dataToSave._id; // _id não existe no Prisma nativamente
        delete dataToSave.createdAt; // Geralmente auto-gerenciado ou não atualizável diretamente
        delete dataToSave.updatedAt;

        let updated;
        if (this.id) {
          updated = await self.model.update({
            where: { id: this.id },
            data: dataToSave
          });
        } else {
          updated = await self.model.create({
            data: dataToSave
          });
          this.id = updated.id;
          this._id = updated.id;
        }

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
    const dataToSave = coerceFields(this.modelName, { ...data });
    delete dataToSave._id; // Limpa _id se houver
    const doc = await this.model.create({ data: dataToSave });
    return this.wrapDoc(doc);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    try {
      const dataToSave = coerceFields(this.modelName, { ...update });
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
      const c = coerceFields(this.modelName, { ...d });
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

const jsonDB = require('./jsonDB');

module.exports = {
  Padeiro: createProxy('padeiro'),
  Produto: createProxy('produto'),
  Cliente: createProxy('cliente'),
  Colaborador: jsonDB.Colaborador,
  Admin: createProxy('admin'),
  Meta: createProxy('padeiroMeta'),
  Atividade: createProxy('atividade'),
  Avaliacao: createProxy('avaliacao'),
  Cronograma: createProxy('cronograma'),
  Criterio: createProxy('criterio'),
  Localizacao: createProxy('localizacao'),
  HistoricoLocalizacao: jsonDB.HistoricoLocalizacao,
  CronogramaTemplate: jsonDB.CronogramaTemplate,
  TimelineEvent: jsonDB.TimelineEvent,
  PushSubscription: createProxy('pushSubscription'),
  Configuracao: createProxy('configuracao')
};
