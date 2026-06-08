const HigPopovers = {
  init() {
    this.initFlatpickr();
    this.initCustomSelects();
  },

  initFlatpickr() {
    if (typeof flatpickr !== 'undefined') {
      flatpickr("#tarefa-form input[type='date']", {
        locale: "pt",
        altInput: true,
        altFormat: "d/m/Y",
        dateFormat: "Y-m-d",
        disableMobile: true,
        allowInput: true
      });

      flatpickr("#tarefa-form input[type='time']", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        disableMobile: true,
        allowInput: true
      });
    }
  },

  initCustomSelects() {
    const selects = document.querySelectorAll('#tarefa-form select');
    
    selects.forEach(select => {
      // Don't initialize twice
      if (select.dataset.higInitialized) return;
      select.dataset.higInitialized = "true";
      
      // Hide original select
      select.style.display = 'none';
      
      // Create trigger wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'hig-select-wrapper';
      
      const trigger = document.createElement('div');
      trigger.className = `hig-select-trigger ${select.className}`;
      
      const textSpan = document.createElement('span');
      textSpan.className = 'hig-select-text';
      
      const icon = document.createElement('i');
      icon.setAttribute('data-lucide', 'chevron-down');
      icon.className = 'hig-select-icon';
      
      trigger.appendChild(textSpan);
      trigger.appendChild(icon);
      wrapper.appendChild(trigger);
      
      select.parentNode.insertBefore(wrapper, select);
      
      // Function to update trigger text
      const updateText = () => {
        const selectedOpt = select.options[select.selectedIndex];
        textSpan.textContent = selectedOpt ? selectedOpt.text : 'Selecione...';
      };
      
      updateText();
      
      // Popover menu
      let menu = null;
      let isOpen = false;
      
      const closeMenu = () => {
        if (menu) {
          menu.style.opacity = '0';
          menu.style.transform = 'scale(0.95) translateY(-5px)';
          setTimeout(() => {
            if (menu && menu.parentNode) {
              menu.parentNode.removeChild(menu);
            }
            menu = null;
          }, 200);
        }
        isOpen = false;
        trigger.classList.remove('active');
        document.removeEventListener('click', clickOutsideHandler);
      };
      
      const clickOutsideHandler = (e) => {
        if (!wrapper.contains(e.target) && (!menu || !menu.contains(e.target))) {
          closeMenu();
        }
      };
      
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (isOpen) {
          closeMenu();
          return;
        }
        
        // Close other open menus
        document.querySelectorAll('.hig-select-menu').forEach(m => {
           // Find its close function if possible, but simplest is to just remove them
           m.style.opacity = '0';
           setTimeout(() => m.remove(), 200);
        });
        
        trigger.classList.add('active');
        
        menu = document.createElement('div');
        menu.className = 'hig-select-menu';
        
        const rect = wrapper.getBoundingClientRect();
        
        // Collect valid options
        const validOptions = Array.from(select.options).filter(opt => !(opt.value === "" && opt.disabled));
        const hasSearch = validOptions.length > 5;
        
        // Add search input if many options
        if (hasSearch) {
          const searchWrap = document.createElement('div');
          searchWrap.className = 'hig-select-search-wrap';
          searchWrap.innerHTML = `<input type="text" class="hig-select-search" placeholder="Buscar..." autocomplete="off" />`;
          menu.appendChild(searchWrap);
          
          const searchInput = searchWrap.querySelector('input');
          
          // Prevent click on search from closing
          searchWrap.addEventListener('click', (ev) => ev.stopPropagation());
          
          searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const items = menu.querySelectorAll('.hig-select-item');
            items.forEach(item => {
              const text = item.querySelector('span').textContent.toLowerCase();
              item.style.display = text.includes(query) ? '' : 'none';
            });
          });
          
          // Auto-focus search after menu animation
          setTimeout(() => searchInput.focus(), 100);
        }
        
        // Items container (scrollable area)
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'hig-select-items';
        
        // Render options
        validOptions.forEach((opt, i) => {
          const realIndex = Array.from(select.options).indexOf(opt);
          
          const item = document.createElement('div');
          item.className = 'hig-select-item';
          if (realIndex === select.selectedIndex) {
            item.classList.add('selected');
            item.innerHTML = `<span>${opt.text}</span><i data-lucide="check" class="hig-check"></i>`;
          } else {
            item.innerHTML = `<span>${opt.text}</span>`;
          }
          
          item.addEventListener('click', (ev) => {
            ev.stopPropagation();
            select.selectedIndex = realIndex;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            updateText();
            closeMenu();
          });
          
          itemsContainer.appendChild(item);
        });
        
        menu.appendChild(itemsContainer);
        
        document.body.appendChild(menu);
        
        // Force fixed position before measuring to ensure correct dimensions
        menu.style.position = 'fixed';
        menu.style.left = `${rect.left}px`;
        menu.style.width = `${rect.width}px`;
        menu.style.zIndex = '999999'; // Ensure it's on top of everything
        
        // Position menu
        const menuRect = menu.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        let top;
        // Assume a minimum height if it reads 0, to avoid off-screen bugs
        const estimatedHeight = menuRect.height > 0 ? menuRect.height : 150;
        
        if (spaceBelow < estimatedHeight + 10 && spaceAbove > spaceBelow) {
          // Open upwards
          top = rect.top - estimatedHeight - 4;
          menu.style.transformOrigin = 'bottom center';
        } else {
          // Open downwards
          top = rect.bottom + 4;
          menu.style.transformOrigin = 'top center';
        }
        
        menu.style.top = `${top}px`;
        
        if (window.lucide) {
          window.lucide.createIcons({ root: menu });
        }
        
        // Animate in
        requestAnimationFrame(() => {
          if (!menu) return;
          menu.style.opacity = '1';
          menu.style.transform = 'scale(1) translateY(0)';
        });
        
        isOpen = true;
        document.addEventListener('click', clickOutsideHandler);
      });
      
      // Update text if select value changes externally
      select.addEventListener('change', updateText);
    });
  }
};

window.HigPopovers = HigPopovers;
