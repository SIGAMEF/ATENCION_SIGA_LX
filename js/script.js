// URL de tu Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuqmaQgpdyxwUXTveTrOailRcZb8y27beTU5Rz_3CsCZlT0y7rOLDAV4sEAeGmCO03/exec';

// CONFIGURACIÓN DE SUBMÓDULOS
const subModulos = {
  "MÓDULO ADMINISTRADOR": ["ADMINISTRACIÓN"],
  "MÓDULO CONFIGURACIÓN": ["MAESTROS", "PROCESOS"],
  "MÓDULO LOGÍSTICA": ["TABLAS", "PROGRAMACIÓN", "PEDIDOS", "PROCESOS DE SELECCIÓN", "ADQUISICIONES", "ALMACENES", "GESTIÓN PRESUPUESTAL"],
  "MÓDULO PATRIMONIO": ["TABLAS", "MANTENIMIENTO", "SEGUIMIENTO Y CONTROL", "CONSULTAS / REPORTES", "INMUEBLES", "PROCESOS", "UTILITARIOS", "CONSTRUCCIONES EN CURSO"],
  "MÓDULO PPR": ["TABLAS", "LISTADO DE INSUMOS", "PROGRAMACIÓN", "REPORTES"],
  "PMBSO WEB": ["TABLAS MAESTRAS", "PROGRAMACIÓN CMN"],
  "MÓDULO BIENES CORRIENTES": ["BIENES CORRIENTES"],
  "MARCO GENERAL": ["SIGA MEF", "LOGÍSTICA", "PATRIMONIO", "PPR", "BIENES CORRIENTES", "VERSIONES"]
};

// VARIABLES GLOBALES
let archivosAdjuntos = [];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
let numeroTicketActual = '';
let urlCarpetaActual = '';

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Sistema de Tickets SIGA iniciado');
  
  setupEventListeners();
  setupDragAndDrop();
  updateCharCount();
  
  const cameraButton = document.getElementById('cameraButton');
  if (!isMobileDevice() && cameraButton) {
    cameraButton.style.display = 'none';
  }
  
  setTimeout(() => {
    inicializarAutocompletadoEjecutoras();
  }, 500);
  
  // 🆕 CARGAR DATOS GUARDADOS DEL CACHE
  cargarDatosGuardados();
  
  // 🆕 GUARDAR DATOS AL CAMBIAR
  setupAutoSave();
  
  console.log('✅ Sistema inicializado correctamente');
});

// CONFIGURAR EVENT LISTENERS
function setupEventListeners() {
  document.getElementById('celularUsuario').addEventListener('input', validatePhoneNumber);
  document.getElementById('descripcion').addEventListener('input', updateCharCount);
  document.getElementById('moduloSiga').addEventListener('change', updateSubModulos);
  document.getElementById('cargoUsuario').addEventListener('change', mostrarCampoOtroCargo);
  
  document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (sidebar && menuToggle) {
      if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
        sidebar.classList.remove('active');
      }
    }
  });
}

function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('active');
}

function updateCharCount() {
  const descripcion = document.getElementById('descripcion');
  const charCount = document.getElementById('charCount');
  const remaining = 500 - descripcion.value.length;
  charCount.textContent = remaining;
  
  const counter = document.querySelector('.char-counter');
  if (remaining < 100) {
    counter.style.background = 'rgba(239, 68, 68, 0.9)';
  } else if (remaining < 250) {
    counter.style.background = 'rgba(245, 158, 11, 0.9)';
  } else {
    counter.style.background = 'rgba(99, 102, 241, 0.9)';
  }
}

function validatePhoneNumber() {
  const celularInput = document.getElementById('celularUsuario');
  celularInput.value = celularInput.value.replace(/\D/g, '');
  
  if (/^\d{9}$/.test(celularInput.value)) {
    celularInput.setCustomValidity('');
    celularInput.classList.remove('is-invalid');
    celularInput.classList.add('is-valid');
  } else {
    celularInput.setCustomValidity('Debe ingresar exactamente 9 dígitos');
    celularInput.classList.remove('is-valid');
    if (celularInput.value.length > 0) {
      celularInput.classList.add('is-invalid');
    }
  }
}

function updateSubModulos() {
  const moduloSelect = document.getElementById('moduloSiga');
  const subModuloSelect = document.getElementById('subModuloSiga');
  const modulo = moduloSelect.value;

  console.log('🔎 Módulo seleccionado:', modulo);

  subModuloSelect.innerHTML = '';
  subModuloSelect.classList.remove('is-valid', 'is-invalid');
  
  if (!modulo) {
    subModuloSelect.disabled = true;
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Primero seleccione un módulo...';
    subModuloSelect.appendChild(option);
    moduloSelect.classList.remove('is-valid', 'is-invalid');
    return;
  }

  moduloSelect.classList.remove('is-invalid');
  moduloSelect.classList.add('is-valid');

  subModuloSelect.disabled = false;
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Seleccione un sub-módulo...';
  subModuloSelect.appendChild(defaultOption);
  
  if (subModulos[modulo] && subModulos[modulo].length > 0) {
    console.log('✅ Cargando submódulos:', subModulos[modulo]);
    
    subModulos[modulo].forEach(sub => {
      const option = document.createElement('option');
      option.value = sub;
      option.textContent = sub;
      subModuloSelect.appendChild(option);
    });
    
    subModuloSelect.style.animation = 'none';
    setTimeout(() => {
      subModuloSelect.style.animation = 'fadeIn 0.3s ease-out';
    }, 10);
    
    mostrarAlerta(`✅ ${subModulos[modulo].length} submódulos cargados`, 'success');
  } else {
    console.error('❌ No hay submódulos para:', modulo);
    subModuloSelect.disabled = true;
    subModuloSelect.innerHTML = '<option value="">No hay submódulos disponibles</option>';
    mostrarAlerta('No se encontraron submódulos', 'warning');
  }
}

function mostrarCampoOtroCargo() {
  const cargoSelect = document.getElementById('cargoUsuario');
  const campoOtroRow = document.getElementById('campoOtroCargoRow');
  const otroCargoInput = document.getElementById('otroCargo');
  
  console.log('🔄 Cargo seleccionado:', cargoSelect.value);
  
  if (cargoSelect.value === 'OTRO') {
    campoOtroRow.style.display = 'block';
    campoOtroRow.style.animation = 'slideDown 0.4s ease-out';
    otroCargoInput.required = true;
    
    setTimeout(() => {
      otroCargoInput.focus();
    }, 200);
    
    cargoSelect.classList.remove('is-invalid');
    cargoSelect.classList.add('is-valid');
    
    console.log('✅ Campo "Otro Cargo" ACTIVADO');
    mostrarAlerta('📝 Por favor especifique su cargo', 'info');
    
  } else {
    campoOtroRow.style.display = 'none';
    otroCargoInput.required = false;
    otroCargoInput.value = '';
    otroCargoInput.classList.remove('is-invalid', 'is-valid');
    
    if (cargoSelect.value) {
      cargoSelect.classList.remove('is-invalid');
      cargoSelect.classList.add('is-valid');
    }
    
    console.log('❌ Campo "Otro Cargo" DESACTIVADO');
  }
}

// MANEJO DE ARCHIVOS
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function setupDragAndDrop() {
  const uploadZone = document.getElementById('fileUploadZone');
  if (!uploadZone) return;
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => {
      uploadZone.classList.add('dragover');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => {
      uploadZone.classList.remove('dragover');
    }, false);
  });
  
  uploadZone.addEventListener('drop', handleDrop, false);
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFileSelect(event) {
  const files = event.target.files;
  handleFiles(files);
}

function handleFiles(files) {
  if (archivosAdjuntos.length + files.length > MAX_FILES) {
    mostrarAlerta(`⚠️ Solo puedes adjuntar un máximo de ${MAX_FILES} archivos`, 'warning');
    return;
  }
  
  Array.from(files).forEach(file => {
    if (file.size > MAX_FILE_SIZE) {
      mostrarAlerta(`❌ "${file.name}" excede 5MB`, 'danger');
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 
                       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!validTypes.includes(file.type)) {
      mostrarAlerta(`❌ "${file.name}" no es un formato válido`, 'danger');
      return;
    }
    
    const fileData = {
      file: file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: null
    };
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileData.preview = e.target.result;
        archivosAdjuntos.push(fileData);
        renderFilesList();
        mostrarAlerta(`✅ "${file.name}" agregado`, 'success');
      };
      reader.readAsDataURL(file);
    } else {
      archivosAdjuntos.push(fileData);
      renderFilesList();
      mostrarAlerta(`✅ "${file.name}" agregado`, 'success');
    }
  });
  
  document.getElementById('fileInput').value = '';
}

function openCamera() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = (e) => {
    handleFiles(e.target.files);
  };
  input.click();
}

function renderFilesList() {
  const filesPreview = document.getElementById('filesPreview');
  const filesList = document.getElementById('filesList');
  const fileCount = document.getElementById('fileCount');
  
  if (archivosAdjuntos.length === 0) {
    filesPreview.classList.remove('show');
    return;
  }
  
  filesPreview.classList.add('show');
  fileCount.textContent = archivosAdjuntos.length;
  
  filesList.innerHTML = archivosAdjuntos.map(file => {
    const fileIcon = getFileIcon(file.type);
    const fileSize = formatFileSize(file.size);
    
    return `
      <div class="file-item-compact" data-file-id="${file.id}">
        ${file.preview ? 
          `<img src="${file.preview}" alt="${file.name}" class="file-thumbnail-compact">` :
          `<div class="file-icon-compact ${fileIcon.class}">
            <i class="${fileIcon.icon}"></i>
          </div>`
        }
        <div class="file-info-compact">
          <p class="file-name-compact" title="${file.name}">${file.name}</p>
          <span class="file-size-compact">
            <i class="fas fa-hdd"></i> ${fileSize}
          </span>
        </div>
        <button type="button" class="btn-remove-compact" onclick="removeFile(${file.id})" title="Eliminar">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }).join('');
}

function getFileIcon(type) {
  if (type.startsWith('image/')) return { icon: 'fas fa-image', class: 'image' };
  if (type === 'application/pdf') return { icon: 'fas fa-file-pdf', class: 'pdf' };
  if (type.includes('word')) return { icon: 'fas fa-file-word', class: 'document' };
  if (type.includes('excel') || type.includes('spreadsheet')) return { icon: 'fas fa-file-excel', class: 'excel' };
  return { icon: 'fas fa-file', class: 'default' };
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function removeFile(fileId) {
  const fileToRemove = archivosAdjuntos.find(file => file.id === fileId);
  archivosAdjuntos = archivosAdjuntos.filter(file => file.id !== fileId);
  renderFilesList();
  
  if (fileToRemove) {
    mostrarAlerta(`🗑️ "${fileToRemove.name}" eliminado`, 'info');
  }
}

// ALERTAS FLOTANTES
function mostrarAlerta(mensaje, tipo = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideInRight 0.3s ease-out;';
  
  const iconos = {
    success: 'fa-check-circle',
    danger: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  alertDiv.innerHTML = `
    <i class="fas ${iconos[tipo]} me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 150);
  }, 3500);
}

// 🆕 MENSAJES DIVERTIDOS ALEATORIOS
const MENSAJES_ENVIO = [
  { texto: '🚀 Despegando tu solicitud...', icono: 'fa-rocket' },
  { texto: '🎯 Apuntando al servidor...', icono: 'fa-bullseye' },
  { texto: '⚡ Enviando a la velocidad de la luz...', icono: 'fa-bolt' },
  { texto: '🎪 Haciendo magia con tu ticket...', icono: 'fa-magic' },
  { texto: '🎨 Pintando tu solicitud...', icono: 'fa-palette' },
  { texto: '🎭 Preparando el show...', icono: 'fa-theater-masks' },
  { texto: '🎸 Rockeando tu ticket...', icono: 'fa-guitar' },
  { texto: '🎮 Cargando nivel: Envío...', icono: 'fa-gamepad' },
  { texto: '🍕 Horneando tu solicitud...', icono: 'fa-pizza-slice' },
  { texto: '☕ Preparando tu café... digo, ticket...', icono: 'fa-coffee' }
];

// 🆕 FUNCIÓN PARA BLOQUEAR FORMULARIO
function bloquearFormulario() {
  const form = document.getElementById('ticketForm');
  const inputs = form.querySelectorAll('input, select, textarea, button');
  
  inputs.forEach(input => {
    input.disabled = true;
    input.style.opacity = '0.6';
    input.style.cursor = 'not-allowed';
  });
  
  // Agregar overlay
  const overlay = document.createElement('div');
  overlay.id = 'form-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 9998;
    backdrop-filter: blur(3px);
  `;
  document.body.appendChild(overlay);
}

// 🆕 FUNCIÓN PARA DESBLOQUEAR FORMULARIO
function desbloquearFormulario() {
  const form = document.getElementById('ticketForm');
  const inputs = form.querySelectorAll('input, select, textarea, button');
  
  inputs.forEach(input => {
    input.disabled = false;
    input.style.opacity = '1';
    input.style.cursor = '';
  });
  
  // Remover overlay
  const overlay = document.getElementById('form-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// 🆕 MOSTRAR MENSAJE DIVERTIDO DE CARGA
function mostrarMensajeCarga() {
  const mensaje = MENSAJES_ENVIO[Math.floor(Math.random() * MENSAJES_ENVIO.length)];
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-message';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px 50px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    text-align: center;
    animation: bounceIn 0.5s ease-out;
    min-width: 350px;
  `;
  
  loadingDiv.innerHTML = `
    <div style="margin-bottom: 20px;">
      <i class="fas ${mensaje.icono} fa-3x" style="animation: spin 2s linear infinite;"></i>
    </div>
    <h3 style="margin: 0 0 10px 0; font-size: 1.3rem; font-weight: 700;">
      ${mensaje.texto}
    </h3>
    <div style="margin-top: 15px;">
      <div class="loading-dots">
        <span style="animation-delay: 0s;">.</span>
        <span style="animation-delay: 0.2s;">.</span>
        <span style="animation-delay: 0.4s;">.</span>
      </div>
    </div>
    <p style="margin: 15px 0 0 0; font-size: 0.9rem; opacity: 0.9;">
      Por favor, no cierres esta ventana
    </p>
  `;
  
  document.body.appendChild(loadingDiv);
  
  // Agregar estilos de animación
  if (!document.getElementById('loading-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
      @keyframes bounceIn {
        0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        70% { transform: translate(-50%, -50%) scale(0.9); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-dots span {
        display: inline-block;
        font-size: 2rem;
        animation: bounce 1.4s infinite ease-in-out both;
        margin: 0 3px;
      }
      
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
}

// 🆕 OCULTAR MENSAJE DE CARGA
function ocultarMensajeCarga() {
  const loadingDiv = document.getElementById('loading-message');
  if (loadingDiv) {
    loadingDiv.style.animation = 'bounceOut 0.5s ease-out';
    setTimeout(() => loadingDiv.remove(), 500);
  }
  
  // Agregar animación de salida
  if (!document.getElementById('loading-styles-out')) {
    const style = document.createElement('style');
    style.id = 'loading-styles-out';
    style.textContent = `
      @keyframes bounceOut {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// 🆕 GUARDAR FORMULARIO CON SUBIDA DE ARCHIVOS - OPTIMIZADO
async function guardarFormulario() {
  const form = document.getElementById('ticketForm');
  let formValid = true;
  let primerCampoInvalido = null;

  console.log('🔎 Iniciando validación del formulario...');

  const codigoUE = document.getElementById('codigoUE');
  const nombreUE = document.getElementById('nombreUE');
  
  if (!codigoUE.value.trim() || nombreUE.value === 'Se completará automáticamente' || !nombreUE.value.trim()) {
    codigoUE.classList.add('is-invalid');
    codigoUE.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = codigoUE;
  } else {
    codigoUE.classList.remove('is-invalid');
    codigoUE.classList.add('is-valid');
  }
  
  const nombreUsuario = document.getElementById('nombreUsuario');
  if (!nombreUsuario.value.trim()) {
    nombreUsuario.classList.add('is-invalid');
    nombreUsuario.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = nombreUsuario;
  } else {
    nombreUsuario.classList.remove('is-invalid');
    nombreUsuario.classList.add('is-valid');
  }
  
  const cargoSelect = document.getElementById('cargoUsuario');
  const otroCargoInput = document.getElementById('otroCargo');
  
  if (!cargoSelect.value) {
    cargoSelect.classList.add('is-invalid');
    cargoSelect.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = cargoSelect;
  } else if (cargoSelect.value === 'OTRO' && !otroCargoInput.value.trim()) {
    cargoSelect.classList.add('is-invalid');
    otroCargoInput.classList.add('is-invalid');
    cargoSelect.classList.remove('is-valid');
    otroCargoInput.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = otroCargoInput;
    mostrarAlerta('⚠️ Debe especificar su cargo cuando selecciona "OTRO"', 'warning');
  } else {
    cargoSelect.classList.remove('is-invalid');
    cargoSelect.classList.add('is-valid');
    if (cargoSelect.value === 'OTRO') {
      otroCargoInput.classList.remove('is-invalid');
      otroCargoInput.classList.add('is-valid');
    }
  }
  
  const correoUsuario = document.getElementById('correoUsuario');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!correoUsuario.value.trim() || !emailRegex.test(correoUsuario.value)) {
    correoUsuario.classList.add('is-invalid');
    correoUsuario.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = correoUsuario;
  } else {
    correoUsuario.classList.remove('is-invalid');
    correoUsuario.classList.add('is-valid');
  }
  
  const celularUsuario = document.getElementById('celularUsuario');
  if (!/^\d{9}$/.test(celularUsuario.value)) {
    celularUsuario.classList.add('is-invalid');
    celularUsuario.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = celularUsuario;
  } else {
    celularUsuario.classList.remove('is-invalid');
    celularUsuario.classList.add('is-valid');
  }
  
  const moduloSiga = document.getElementById('moduloSiga');
  if (!moduloSiga.value) {
    moduloSiga.classList.add('is-invalid');
    moduloSiga.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = moduloSiga;
  } else {
    moduloSiga.classList.remove('is-invalid');
    moduloSiga.classList.add('is-valid');
  }
  
  const subModuloSiga = document.getElementById('subModuloSiga');
  if (!subModuloSiga.value) {
    subModuloSiga.classList.add('is-invalid');
    subModuloSiga.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = subModuloSiga;
  } else {
    subModuloSiga.classList.remove('is-invalid');
    subModuloSiga.classList.add('is-valid');
  }
  
  const descripcion = document.getElementById('descripcion');
  if (!descripcion.value.trim() || descripcion.value.trim().length < 10) {
    descripcion.classList.add('is-invalid');
    descripcion.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = descripcion;
  } else {
    descripcion.classList.remove('is-invalid');
    descripcion.classList.add('is-valid');
  }
  
  if (!formValid) {
    if (primerCampoInvalido) {
      primerCampoInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => primerCampoInvalido.focus(), 500);
    }
    mostrarAlerta('❌ Por favor, complete todos los campos obligatorios correctamente', 'danger');
    return;
  }

  // 🆕 BLOQUEAR FORMULARIO Y MOSTRAR MENSAJE DIVERTIDO
  bloquearFormulario();
  mostrarMensajeCarga();

  const btnEnviar = document.querySelector('.btn-enviar-compact');
  const originalText = btnEnviar.innerHTML;
  btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  btnEnviar.disabled = true;

  const nombreUEField = document.getElementById('nombreUE');
  const inputCoordinador = document.getElementById('coorD');
  
  let cargoFinal = cargoSelect.value;
  if (cargoSelect.value === 'OTRO') {
    cargoFinal = otroCargoInput.value.trim();
  }
  
  const coordinadorAbrev = inputCoordinador.value || nombreUEField.dataset.coordinadorAbrev || '';
  const correoCoordinador = nombreUEField.dataset.correoCoordinador || '';
  const coordinadorNombreCompleto = nombreUEField.dataset.coordinador || coordinadorAbrev;
  const analistaDGA = nombreUEField.dataset.analistaDGA || 'DANIEL MARROQUIN';
  
  const datos = {
    codigoUE: codigoUE.value,
    nombreUE: nombreUEField.value,
    coordinadorAbrev: coordinadorAbrev,
    correoCoordinador: correoCoordinador,
    coordinador: coordinadorNombreCompleto,
    nombreUsuario: nombreUsuario.value,
    cargoUsuario: cargoFinal,
    correoUsuario: correoUsuario.value,
    celularUsuario: celularUsuario.value,
    modulo: moduloSiga.value,
    submodulo: subModuloSiga.value,
    descripcion: descripcion.value,
    analistaDGA: analistaDGA
  };

  console.log('📋 Datos del formulario (COMPLETOS):', datos);

  // 🆕 GUARDAR EN GOOGLE SHEETS
  try {
    const resultado = await guardarTicket(datos);
    
    if (resultado.success) {
      numeroTicketActual = resultado.numeroTicket;
      urlCarpetaActual = resultado.urlCarpeta || '';
      
      console.log('✅ Ticket guardado:', numeroTicketActual);
      console.log('📁 URL Carpeta:', urlCarpetaActual);
      
      // 🆕 SUBIR ARCHIVOS SI HAY ALGUNO (EN SEGUNDO PLANO)
      if (archivosAdjuntos.length > 0) {
        // Cambiar mensaje
        const loadingDiv = document.getElementById('loading-message');
        if (loadingDiv) {
          loadingDiv.querySelector('h3').textContent = `📤 Subiendo ${archivosAdjuntos.length} archivo(s)...`;
          loadingDiv.querySelector('i').className = 'fas fa-cloud-upload-alt fa-3x';
        }
        
        try {
          const resultadosArchivos = await subirMultiplesArchivos(
            numeroTicketActual,
            archivosAdjuntos,
            (actual, total, nombre) => {
              const loadingDiv = document.getElementById('loading-message');
              if (loadingDiv) {
                loadingDiv.querySelector('h3').textContent = `📤 Subiendo ${actual}/${total}: ${nombre.substring(0, 20)}...`;
              }
              console.log(`📤 ${actual}/${total}: ${nombre}`);
            }
          );
          
          const exitosos = resultadosArchivos.filter(r => r.success).length;
          const fallidos = resultadosArchivos.filter(r => !r.success).length;
          
          console.log(`✅ Archivos subidos: ${exitosos}/${archivosAdjuntos.length}`);
          
          if (fallidos > 0) {
            mostrarAlerta(`⚠️ ${exitosos} archivo(s) subido(s), ${fallidos} fallaron`, 'warning');
          }
        } catch (uploadError) {
          console.error('❌ Error al subir archivos:', uploadError);
        }
      }
      
      // 🆕 OCULTAR MENSAJE DE CARGA Y DESBLOQUEAR
      ocultarMensajeCarga();
      desbloquearFormulario();
      
      btnEnviar.innerHTML = originalText;
      btnEnviar.disabled = false;
      
      mostrarConfirmacion(resultado.numeroTicket, urlCarpetaActual);
      
      if (resultado.correoEnviado) {
        mostrarAlerta('✅ Ticket guardado y correo enviado exitosamente', 'success');
      } else {
        mostrarAlerta('✅ Ticket guardado (correo se enviará en breve)', 'success');
      }
    } else {
      ocultarMensajeCarga();
      desbloquearFormulario();
      btnEnviar.innerHTML = originalText;
      btnEnviar.disabled = false;
      mostrarAlerta('❌ Error al guardar: ' + resultado.message, 'danger');
    }
    
  } catch (error) {
    console.error('❌ Error al guardar:', error);
    ocultarMensajeCarga();
    desbloquearFormulario();
    btnEnviar.innerHTML = originalText;
    btnEnviar.disabled = false;
    mostrarAlerta('❌ Error de conexión al guardar el ticket', 'danger');
  }
}

// 🆕 CONFIRMACIÓN SIN BOTÓN DE CARPETA
function mostrarConfirmacion(numeroTicket, urlCarpeta) {
  document.getElementById('formContainer').style.display = 'none';
  document.getElementById('confirmacionContainer').style.display = 'block';
  document.getElementById('numeroTicket').textContent = numeroTicket;
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nuevoTicket() {
  document.getElementById('confirmacionContainer').style.display = 'none';
  document.getElementById('formContainer').style.display = 'block';
  
  // 🆕 NO resetear el formulario para mantener los datos en caché
  // Solo limpiar descripción y módulos
  document.getElementById('descripcion').value = '';
  document.getElementById('moduloSiga').value = '';
  document.getElementById('subModuloSiga').value = '';
  document.getElementById('subModuloSiga').disabled = true;
  
  archivosAdjuntos = [];
  renderFilesList();
  
  // Limpiar validaciones visuales
  document.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
    el.classList.remove('is-invalid', 'is-valid');
  });
  
  numeroTicketActual = '';
  urlCarpetaActual = '';
  
  updateCharCount();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  mostrarAlerta('📄 Los datos de tu UE y usuario se mantienen guardados', 'info');
}

// 🆕 ENVIAR WHATSAPP - VERSIÓN SIMPLIFICADA
async function enviarWhatsApp() {
  const numeroTicketElement = document.getElementById('numeroTicket');
  const numeroTicket = numeroTicketElement ? numeroTicketElement.textContent : 'SIGA-2025-0000';
  
  const numeroCorrelativo = numeroTicket.split('-')[2] || '0000';
  
  const nombreUsuario = document.getElementById('nombreUsuario').value || 'Usuario';
  const nombreUE = document.getElementById('nombreUE').value || 'Unidad Ejecutora';
  
  const mensaje = `Hola Daniel, ${nombreUsuario} de ${nombreUE}, He generado la AT Nro ${numeroCorrelativo}
Un favor, me avisas para enviarte el acceso o llamarte?
Gracias!`;
  
  const url = `https://wa.me/51964374113?text=${encodeURIComponent(mensaje)}`;
  
  console.log('📱 Abriendo WhatsApp Web...');
  
  // Abrir WhatsApp Web en nueva pestaña
  window.open(url, '_blank');
  
  mostrarAlerta('✅ Abriendo WhatsApp Web...', 'success');
}

// Función auxiliar (ya no es necesaria en versión simplificada, pero la dejamos por compatibilidad)
function enviarWhatsAppTexto(numeroCorrelativo, nombreUsuario, nombreUE) {
  const mensaje = `Hola Daniel, ${nombreUsuario} de ${nombreUE}, He generado la AT Nro ${numeroCorrelativo}
Un favor, me avisas para enviarte el acceso o llamarte?
Gracias!`;
  
  const url = `https://wa.me/51964374113?text=${encodeURIComponent(mensaje)}`;
  
  window.open(url, '_blank');
}

// ========================================
// AUTOCOMPLETADO DE EJECUTORAS
// ========================================

let timeoutBusqueda = null;
let sugerenciasDiv = null;
let busquedaActiva = false;

function inicializarAutocompletadoEjecutoras() {
  console.log('🚀 Inicializando autocompletado de ejecutoras...');
  
  const inputCodigoUE = document.getElementById('codigoUE');
  const inputNombreUE = document.getElementById('nombreUE');
  const inputCoordinador = document.getElementById('coorD');
  
  if (!inputCodigoUE) {
    console.error('❌ No se encontró el input codigoUE');
    return;
  }
  
  inputCodigoUE.setAttribute('type', 'text');
  inputCodigoUE.setAttribute('autocomplete', 'off');
  
  sugerenciasDiv = document.createElement('div');
  sugerenciasDiv.id = 'sugerencias-ejecutoras';
  sugerenciasDiv.className = 'sugerencias-ejecutoras';
  
  const parent = inputCodigoUE.parentElement;
  parent.style.position = 'relative';
  parent.appendChild(sugerenciasDiv);
  
  inputCodigoUE.addEventListener('input', function(e) {
    const termino = this.value.trim();
    
    clearTimeout(timeoutBusqueda);
    
    if (termino.length === 0) {
      inputNombreUE.value = '';
      inputCoordinador.value = '';
      ocultarSugerencias();
      limpiarValidacion(inputCodigoUE);
      limpiarValidacion(inputNombreUE);
      limpiarValidacion(inputCoordinador);
      return;
    }
    
    if (termino.length < 2) {
      mostrarMensajeSugerencias('keyboard', 'Escriba al menos 2 caracteres...', 'info');
      return;
    }
    
    mostrarMensajeSugerencias('spinner fa-spin', 'Buscando...', 'loading');
    busquedaActiva = true;
    
    timeoutBusqueda = setTimeout(async () => {
      try {
        const resultado = await buscarEjecutoras(termino);
        
        if (!busquedaActiva) return;
        
        if (resultado.success && resultado.resultados && resultado.resultados.length > 0) {
          mostrarSugerenciasEjecutoras(resultado.resultados);
        } else if (resultado.success && resultado.resultados.length === 0) {
          mostrarMensajeSugerencias('search', 'No se encontraron resultados', 'empty');
          marcarComoInvalido(inputCodigoUE, 'No se encontró la ejecutora');
        } else {
          mostrarMensajeSugerencias('exclamation-triangle', resultado.message || 'Error al buscar', 'error');
          marcarComoInvalido(inputCodigoUE, 'Error al buscar');
        }
      } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        mostrarMensajeSugerencias('exclamation-triangle', 'Error de conexión', 'error');
        marcarComoInvalido(inputCodigoUE, 'Error de conexión');
      }
    }, 300);
  });
  
  inputCodigoUE.addEventListener('focus', function() {
    if (this.value.trim().length >= 2 && sugerenciasDiv.children.length > 0) {
      sugerenciasDiv.style.display = 'block';
    }
  });
  
  document.addEventListener('click', function(e) {
    if (!inputCodigoUE.contains(e.target) && !sugerenciasDiv.contains(e.target)) {
      ocultarSugerencias();
    }
  });
  
  console.log('✅ Autocompletado inicializado correctamente');
}

function mostrarMensajeSugerencias(icono, texto, tipo) {
  const colores = {
    info: '#6b7280',
    loading: '#1e3a8a',
    empty: '#6b7280',
    error: '#dc2626'
  };
  
  sugerenciasDiv.innerHTML = `
    <div style="padding: 20px; text-align: center; color: ${colores[tipo] || colores.info};">
      <i class="fas fa-${icono}" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
      <p style="margin: 0; font-weight: 600; font-size: 0.9rem;">${texto}</p>
    </div>
  `;
  sugerenciasDiv.style.display = 'block';
}

function mostrarSugerenciasEjecutoras(resultados) {
  console.log('📋 Mostrando', resultados.length, 'sugerencias');
  
  sugerenciasDiv.innerHTML = '';
  
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    color: white;
    padding: 12px 14px;
    font-weight: 600;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 6px 6px 0 0;
  `;
  header.innerHTML = `
    <i class="fas fa-building"></i>
    ${resultados.length} ejecutora${resultados.length !== 1 ? 's' : ''} encontrada${resultados.length !== 1 ? 's' : ''}
  `;
  sugerenciasDiv.appendChild(header);
  
  resultados.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'sugerencia-item';
    div.style.cssText = `
      padding: 14px;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.2s ease;
      background: white;
    `;
    
    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="
          background: #1e3a8a; 
          color: white; 
          padding: 4px 12px; 
          border-radius: 5px; 
          font-size: 0.8rem; 
          font-weight: 700;
          min-width: 60px;
          text-align: center;
        ">
          ${item.codigo}
        </span>
        <span style="font-weight: 600; color: #1f2937; flex: 1; font-size: 0.9rem; line-height: 1.4;">
          ${item.nombre}
        </span>
      </div>
      <div style="
        font-size: 0.85rem; 
        color: #6b7280; 
        padding-left: 70px; 
        display: flex; 
        align-items: center; 
        gap: 6px;
      ">
        <i class="fas fa-user-tie"></i>
        <span>${item.coordinador}</span>
      </div>
    `;
    
    div.addEventListener('mouseenter', function() {
      this.style.background = '#eff6ff';
      this.style.borderLeft = '4px solid #1e3a8a';
      this.style.paddingLeft = '10px';
      this.style.transform = 'translateX(2px)';
    });
    
    div.addEventListener('mouseleave', function() {
      this.style.background = 'white';
      this.style.borderLeft = 'none';
      this.style.paddingLeft = '14px';
      this.style.transform = 'translateX(0)';
    });
    
    div.addEventListener('click', function() {
      seleccionarEjecutora(item);
    });
    
    sugerenciasDiv.appendChild(div);
  });
  
  sugerenciasDiv.style.display = 'block';
  busquedaActiva = false;
}

function seleccionarEjecutora(item) {
  console.log('✅ Ejecutora seleccionada:', item);
  
  const inputCodigo = document.getElementById('codigoUE');
  const inputNombre = document.getElementById('nombreUE');
  const inputCoordinador = document.getElementById('coorD');
  
  inputCodigo.value = item.codigo;
  inputNombre.value = item.nombre;
  inputCoordinador.value = item.coordinadorAbrev;
  
  inputNombre.dataset.coordinadorAbrev = item.coordinadorAbrev || '';
  inputNombre.dataset.correoCoordinador = item.correo || '';
  inputNombre.dataset.coordinador = item.coordinador || '';
  inputNombre.dataset.analistaDGA = item.analistaDGA || 'DANIEL MARROQUIN';
  
  console.log('📦 Datos guardados en dataset:', {
    coordinadorAbrev: item.coordinadorAbrev,
    correoCoordinador: item.correo,
    coordinador: item.coordinador,
    analistaDGA: item.analistaDGA
  });
  
  ocultarSugerencias();
  
  marcarComoValido(inputCodigo);
  marcarComoValido(inputNombre);
  marcarComoValido(inputCoordinador);
  
  mostrarNotificacionEjecutora('✅ Ejecutora seleccionada correctamente', 'success');
  
  busquedaActiva = false;
  
  // 🆕 Guardar en caché después de seleccionar
  guardarDatosFormulario();
}

function marcarComoValido(input) {
  input.classList.remove('is-invalid');
  input.classList.add('is-valid');
  
  const feedback = input.parentElement.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.style.display = 'none';
  }
}

function marcarComoInvalido(input, mensaje) {
  input.classList.remove('is-valid');
  input.classList.add('is-invalid');
  
  let feedback = input.parentElement.querySelector('.invalid-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    input.parentElement.appendChild(feedback);
  }
  feedback.textContent = mensaje;
  feedback.style.display = 'block';
}

function limpiarValidacion(input) {
  input.classList.remove('is-valid', 'is-invalid');
  const feedback = input.parentElement.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.style.display = 'none';
  }
}

function ocultarSugerencias() {
  if (sugerenciasDiv) {
    sugerenciasDiv.style.display = 'none';
    sugerenciasDiv.innerHTML = '';
  }
  busquedaActiva = false;
}

function mostrarNotificacionEjecutora(mensaje, tipo = 'info') {
  const colores = {
    success: { bg: '#f0fdf4', border: '#059669', text: '#065f46', icon: 'fa-check-circle' },
    error: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', icon: 'fa-exclamation-circle' },
    info: { bg: '#eff6ff', border: '#0284c7', text: '#1e3a8a', icon: 'fa-info-circle' }
  };
  
  const color = colores[tipo] || colores.info;
  
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color.bg};
    border: 2px solid ${color.border};
    border-left: 5px solid ${color.border};
    color: ${color.text};
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideInRight 0.3s ease-out;
    min-width: 300px;
  `;
  
  notif.innerHTML = `
    <i class="fas ${color.icon}" style="font-size: 1.3rem;"></i>
    <span style="flex: 1;">${mensaje}</span>
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// ========================================
// 🆕 SISTEMA DE CACHÉ PARA FORMULARIO
// ========================================

// Cargar datos guardados del localStorage
function cargarDatosGuardados() {
  try {
    const datosGuardados = localStorage.getItem('sigaFormData');
    
    if (datosGuardados) {
      const datos = JSON.parse(datosGuardados);
      
      console.log('📦 Cargando datos guardados del caché...');
      
      // Restaurar datos de UE
      if (datos.codigoUE) document.getElementById('codigoUE').value = datos.codigoUE;
      if (datos.nombreUE) document.getElementById('nombreUE').value = datos.nombreUE;
      if (datos.coordinador) document.getElementById('coorD').value = datos.coordinador;
      
      // Restaurar datos del usuario
      if (datos.nombreUsuario) document.getElementById('nombreUsuario').value = datos.nombreUsuario;
      if (datos.cargoUsuario) {
        document.getElementById('cargoUsuario').value = datos.cargoUsuario;
        if (datos.cargoUsuario === 'OTRO' && datos.otroCargo) {
          document.getElementById('campoOtroCargoRow').style.display = 'block';
          document.getElementById('otroCargo').value = datos.otroCargo;
        }
      }
      if (datos.correoUsuario) document.getElementById('correoUsuario').value = datos.correoUsuario;
      if (datos.celularUsuario) document.getElementById('celularUsuario').value = datos.celularUsuario;
      
      // Restaurar datasets
      const nombreUEField = document.getElementById('nombreUE');
      if (datos.coordinadorAbrev) nombreUEField.dataset.coordinadorAbrev = datos.coordinadorAbrev;
      if (datos.correoCoordinador) nombreUEField.dataset.correoCoordinador = datos.correoCoordinador;
      if (datos.coordinadorCompleto) nombreUEField.dataset.coordinador = datos.coordinadorCompleto;
      if (datos.analistaDGA) nombreUEField.dataset.analistaDGA = datos.analistaDGA;
      
      mostrarAlerta('📦 Datos cargados desde el caché', 'success');
      console.log('✅ Datos restaurados exitosamente');
    }
  } catch (error) {
    console.error('❌ Error al cargar datos del caché:', error);
  }
}

// Configurar auto-guardado
function setupAutoSave() {
  const camposAGuardar = [
    'codigoUE', 'nombreUE', 'coorD',
    'nombreUsuario', 'cargoUsuario', 'otroCargo',
    'correoUsuario', 'celularUsuario'
  ];
  
  camposAGuardar.forEach(campoId => {
    const campo = document.getElementById(campoId);
    if (campo) {
      campo.addEventListener('change', guardarDatosFormulario);
      campo.addEventListener('blur', guardarDatosFormulario);
    }
  });
  
  console.log('💾 Sistema de auto-guardado activado');
}

// Guardar datos del formulario en localStorage
function guardarDatosFormulario() {
  try {
    const nombreUEField = document.getElementById('nombreUE');
    
    const datos = {
      codigoUE: document.getElementById('codigoUE').value,
      nombreUE: nombreUEField.value,
      coordinador: document.getElementById('coorD').value,
      nombreUsuario: document.getElementById('nombreUsuario').value,
      cargoUsuario: document.getElementById('cargoUsuario').value,
      otroCargo: document.getElementById('otroCargo').value,
      correoUsuario: document.getElementById('correoUsuario').value,
      celularUsuario: document.getElementById('celularUsuario').value,
      // Guardar datasets también
      coordinadorAbrev: nombreUEField.dataset.coordinadorAbrev || '',
      correoCoordinador: nombreUEField.dataset.correoCoordinador || '',
      coordinadorCompleto: nombreUEField.dataset.coordinador || '',
      analistaDGA: nombreUEField.dataset.analistaDGA || ''
    };
    
    localStorage.setItem('sigaFormData', JSON.stringify(datos));
    console.log('💾 Datos guardados en caché');
    
  } catch (error) {
    console.error('❌ Error al guardar datos:', error);
  }
}

// Limpiar caché (opcional)
function limpiarCacheFormulario() {
  try {
    localStorage.removeItem('sigaFormData');
    console.log('🗑️ Caché del formulario limpiado');
    mostrarAlerta('🗑️ Caché limpiado exitosamente', 'info');
  } catch (error) {
    console.error('❌ Error al limpiar caché:', error);
  }
}