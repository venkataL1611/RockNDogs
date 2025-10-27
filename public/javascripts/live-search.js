(function(){
  const input = document.querySelector('input[name="q"]');
  if(!input) return;

  // create results container
  const resultsBox = document.createElement('div');
  resultsBox.className = 'live-search-box';
  resultsBox.style.display = 'none';
  input.parentNode.style.position = 'relative';
  input.parentNode.appendChild(resultsBox);

  let timeout = null;
  let selected = -1;

  function clearResults(){ 
    resultsBox.innerHTML = ''; 
    resultsBox.style.display = 'none'; 
    selected = -1; 
  }

  function renderResults(items){
    resultsBox.innerHTML = '';
    if(!items || !items.length){ 
      resultsBox.innerHTML = '<div class="ls-item empty">No results found</div>'; 
      resultsBox.style.display = 'block'; 
      return; 
    }
    items.forEach((item, idx) => {
      const node = document.createElement('a');
      node.className = 'ls-item';
      // Link to product detail page - assume dogfood type, could be improved
      const productType = item._type || 'dogfood';
      node.href = '/product/' + productType + '/' + (item._id || '');
      
      const img = item.imagepath ? '<img src="' + item.imagepath + '" alt="" class="ls-thumb">' : '';
      const title = item.title || item.Title || '';
      const desc = (item.description || '').substring(0, 80);
      const price = item.Price ? '$' + item.Price : '';
      
      node.innerHTML = img + '<div class="ls-meta"><div class="ls-title">' + title + '</div><div class="ls-desc">' + desc + '</div></div><div class="ls-price">' + price + '</div>';
      
      node.addEventListener('mouseenter', function(){ setSelected(idx); });
      node.addEventListener('mouseleave', function(){ setSelected(-1); });
      resultsBox.appendChild(node);
    });
    resultsBox.style.display = 'block';
  }

  function setSelected(i){
    const items = resultsBox.querySelectorAll('.ls-item');
    items.forEach(function(el, idx){ 
      if(idx === i) el.classList.add('selected');
      else el.classList.remove('selected');
    });
    selected = i;
  }

  input.addEventListener('input', function(){
    clearTimeout(timeout);
    const q = input.value.trim();
    if(!q){ clearResults(); return; }
    
    timeout = setTimeout(function(){
      console.log('Searching for:', q);
      fetch('/api/search?q=' + encodeURIComponent(q))
        .then(function(r){ return r.json(); })
        .then(function(payload){ 
          console.log('Results:', payload.results ? payload.results.length : 0);
          renderResults(payload.results || []); 
        })
        .catch(function(err){ 
          console.error('Search error:', err);
          resultsBox.innerHTML = '<div class="ls-item empty">Error loading results</div>'; 
          resultsBox.style.display = 'block'; 
        });
    }, 180);
  });

  input.addEventListener('keydown', function(e){
    const items = resultsBox.querySelectorAll('.ls-item');
    if(!items || !items.length) return;
    
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      setSelected(Math.min(selected + 1, items.length - 1));
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      setSelected(Math.max(selected - 1, 0));
    } else if(e.key === 'Enter'){
      if(selected >= 0 && items[selected]){
        items[selected].click();
      }
    } else if(e.key === 'Escape'){
      clearResults();
    }
  });

  document.addEventListener('click', function(e){
    if(!resultsBox.contains(e.target) && e.target !== input) clearResults();
  });

})();
