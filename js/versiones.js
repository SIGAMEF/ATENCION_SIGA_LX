/**
 * SISTEMA DE VERSIONES SIGA MEF
 * Carga y muestra versiones desde Google Sheets
 */

// URL de tu Google Apps Script
const VERSIONES_API_URL = 'https://script.google.com/macros/s/AKfycbyuqmaQgpdyxwUXTveTrOailRcZb8y27beTU5Rz_3CsCZlT0y7rOLDAV4sEAeGmCO03/exec';

let versionesData = [];
let versionesFiltradas = [];

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Sistema de Versiones iniciado');
  
  cargarVersiones();
  setupEventListeners();
});

// ===== CONFIGURAR EVENT LISTENERS =====
function setupEventListeners() {
  const searchInput = document.getElementById('searchVersions');
  const filterYear = document.getElementById('filterYear');
  
  if (searchInput) {
    searchInput.addEventListener('input', filtrarVersiones);
  }
  
  if (filterYear) {
    filterYear.addEventListener('change', filtrarVersiones);
  }
}

// ===== CARGAR VERSIONES CON JSONP =====
async function cargarVersiones() {
  try {
    mostrarCargando(true);
    
    console.log('📡 Solicitando versiones...');
    
    const url = `${VERSIONES_API_URL}?action=obtenerVersiones`;
    
    const data = await fetchJSONP(url, 15000);
    
    console.log('✅ Respuesta recibida:', data);
    
    if (data.success && data.versiones) {
      versionesData = data.versiones;
      versionesFiltradas = [...versionesData];
      
      renderVersiones(versionesFiltradas);
      setupYearFilter();
      
      mostrarAlerta(`✅ ${data.versiones.length} versiones cargadas`, 'success');
    } else {
      throw new Error(data.message || 'No se pudieron cargar las versiones');
    }
    
  } catch (error) {
    console.error('❌ Error al cargar versiones:', error);
    mostrarError('Error al cargar versiones: ' + error.message);
  } finally {
    mostrarCargando(false);
  }
}

// ===== FUNCIÓN JSONP (IGUAL QUE EN api.js) =====
function fetchJSONP(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const script = document.createElement('script');
    let timeoutId;
    
    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Request timeout'));
    }, timeout);
    
    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };
    
    script.onerror = () => {
      cleanup();
      reject(new Error('Script load error'));
    };
    
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${callbackName}`;
    
    document.head.appendChild(script);
  });
}

// ===== RENDERIZAR VERSIONES =====
function renderVersiones(versiones) {
  const container = document.getElementById('versionesContainer');
  
  if (!container) {
    console.error('❌ No se encontró el contenedor de versiones');
    return;
  }
  
  if (!versiones || versiones.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info text-center">
        <i class="fas fa-info-circle fa-2x mb-3"></i>
        <p class="mb-0">No hay versiones disponibles</p>
      </div>
    `;
    return;
  }
  
  // Agrupar por año
  const versionesPorAnio = {};
  
  versiones.forEach(version => {
    const anio = version.anio || version.fecha.split('/')[2] || 'Sin fecha';
    
    if (!versionesPorAnio[anio]) {
      versionesPorAnio[anio] = [];
    }
    
    versionesPorAnio[anio].push(version);
  });
  
  // Ordenar años descendente
  const aniosOrdenados = Object.keys(versionesPorAnio).sort((a, b) => b - a);
  
  let html = '';
  
  aniosOrdenados.forEach(anio => {
    html += `
      <div class="year-section mb-4">
        <h3 class="year-title">
          <i class="fas fa-calendar-alt"></i> ${anio}
        </h3>
        <div class="versions-grid">
    `;
    
    versionesPorAnio[anio].forEach(version => {
      const tipoClass = getTipoClass(version.tipo);
      const tipoIcon = getTipoIcon(version.tipo);
      const tieneDescarga = version.linkDescarga && version.linkDescarga.trim() !== '';
      
      html += `
        <div class="version-card ${tipoClass}">
          <div class="version-header">
            <span class="version-badge">
              <i class="${tipoIcon}"></i>
              ${version.version}
            </span>
            <span class="version-date">
              <i class="fas fa-calendar"></i>
              ${version.fecha}
            </span>
          </div>
          <div class="version-body">
            <h5 class="version-module">
              <i class="fas fa-cube"></i>
              ${version.modulo}
            </h5>
            <p class="version-description">
              ${version.descripcion}
            </p>
          </div>
          <div class="version-footer">
            <span class="version-type ${version.tipo}">
              ${version.tipo.toUpperCase()}
            </span>
            ${tieneDescarga ? `
              <a href="${version.linkDescarga}" 
                 target="_blank" 
                 class="btn-download"
                 title="Descargar versión">
                <i class="fas fa-download"></i>
                Descargar
              </a>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Animar entrada
  const cards = container.querySelectorAll('.version-card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.style.animation = 'fadeInUp 0.5s ease-out forwards';
    }, index * 50);
  });
}

// ===== FILTRAR VERSIONES =====
function filtrarVersiones() {
  const searchInput = document.getElementById('searchVersions');
  const filterYear = document.getElementById('filterYear');
  
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const selectedYear = filterYear ? filterYear.value : '';
  
  versionesFiltradas = versionesData.filter(version => {
    const cumpleBusqueda = !searchTerm || 
      version.version.toLowerCase().includes(searchTerm) ||
      version.modulo.toLowerCase().includes(searchTerm) ||
      version.descripcion.toLowerCase().includes(searchTerm);
    
    const cumpleAnio = !selectedYear || 
      version.fecha.includes(selectedYear);
    
    return cumpleBusqueda && cumpleAnio;
  });
  
  renderVersiones(versionesFiltradas);
  
  const resultCount = document.getElementById('resultCount');
  if (resultCount) {
    resultCount.textContent = `${versionesFiltradas.length} versiones encontradas`;
  }
}

// ===== CONFIGURAR FILTRO DE AÑOS =====
function setupYearFilter() {
  const filterYear = document.getElementById('filterYear');
  
  if (!filterYear) return;
  
  const anios = new Set();
  
  versionesData.forEach(version => {
    const fecha = version.fecha || '';
    const anio = fecha.split('/')[2];
    if (anio) anios.add(anio);
  });
  
  const aniosOrdenados = Array.from(anios).sort((a, b) => b - a);
  
  filterYear.innerHTML = '<option value="">Todos los años</option>';
  
  aniosOrdenados.forEach(anio => {
    const option = document.createElement('option');
    option.value = anio;
    option.textContent = anio;
    filterYear.appendChild(option);
  });
}

// ===== HELPERS =====
function getTipoClass(tipo) {
  const tipos = {
    'nuevo': 'tipo-nuevo',
    'mejora': 'tipo-mejora',
    'correccion': 'tipo-correccion'
  };
  return tipos[tipo?.toLowerCase()] || 'tipo-mejora';
}

function getTipoIcon(tipo) {
  const iconos = {
    'nuevo': 'fas fa-star',
    'mejora': 'fas fa-arrow-up',
    'correccion': 'fas fa-wrench'
  };
  return iconos[tipo?.toLowerCase()] || 'fas fa-code';
}

function mostrarCargando(mostrar) {
  const loadingDiv = document.getElementById('loadingVersions');
  const container = document.getElementById('versionesContainer');
  
  if (loadingDiv) {
    loadingDiv.style.display = mostrar ? 'block' : 'none';
  }
  
  if (container && mostrar) {
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3">Cargando versiones desde Google Sheets...</p>
      </div>
    `;
  }
}

function mostrarError(mensaje) {
  const container = document.getElementById('versionesContainer');
  
  if (container) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${mensaje}
        <button class="btn btn-sm btn-outline-danger mt-3" onclick="cargarVersiones()">
          <i class="fas fa-sync-alt"></i> Reintentar
        </button>
      </div>
    `;
  }
}

function mostrarAlerta(mensaje, tipo = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  
  alertDiv.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 150);
  }, 3000);
}

// ===== TOGGLE MENU (MÓVIL) =====
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('active');
  }
}
