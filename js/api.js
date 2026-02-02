/**
 * API PARA CONSULTAR EJECUTORAS Y GUARDAR TICKETS
 * Archivo: js/api.js
 * ✅ USA JSONP PARA EVITAR PROBLEMAS DE CORS
 * ✅ CORREGIDO: Envío de correo coordinador
 * 🆕 SUBIDA DE ARCHIVOS A GOOGLE DRIVE
 */

// ===== CONFIGURACIÓN =====
const API_CONFIG = {
  URL: 'https://script.google.com/macros/s/AKfycbyuqmaQgpdyxwUXTveTrOailRcZb8y27beTU5Rz_3CsCZlT0y7rOLDAV4sEAeGmCO03/exec',
  TIMEOUT: 15000,
  CACHE_TIEMPO: 5 * 60 * 1000
};

// Cache simple
let cacheResultados = new Map();
let cacheTimestamps = new Map();

// ===== FUNCIÓN JSONP (SOLUCIÓN CORS) =====
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

// ===== BUSCAR EJECUTORAS =====
async function buscarEjecutoras(termino) {
  try {
    if (!termino || termino.trim().length < 2) {
      return { 
        success: true, 
        resultados: [],
        message: 'Ingrese al menos 2 caracteres'
      };
    }
    
    const terminoLimpio = termino.trim();
    
    const cacheKey = `buscar_${terminoLimpio.toLowerCase()}`;
    const ahora = Date.now();
    
    if (cacheResultados.has(cacheKey) && 
        cacheTimestamps.has(cacheKey) && 
        (ahora - cacheTimestamps.get(cacheKey)) < API_CONFIG.CACHE_TIEMPO) {
      console.log('📦 Usando resultado en cache para:', terminoLimpio);
      return cacheResultados.get(cacheKey);
    }
    
    const url = `${API_CONFIG.URL}?action=buscar&termino=${encodeURIComponent(terminoLimpio)}`;
    
    console.log('🔍 Buscando:', terminoLimpio);
    console.log('📡 URL:', url);
    
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Respuesta recibida:', data);
    
    if (data.success && data.resultados && data.resultados.length > 0) {
      cacheResultados.set(cacheKey, data);
      cacheTimestamps.set(cacheKey, ahora);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error en buscarEjecutoras:', error);
    return {
      success: false,
      message: 'Error de conexión: ' + error.message,
      resultados: []
    };
  }
}

// ===== OBTENER EJECUTORA POR CÓDIGO =====
async function obtenerEjecutora(codigo) {
  try {
    if (!codigo) {
      return { success: false, message: 'Código no válido' };
    }
    
    const codigoLimpio = codigo.toString().trim();
    
    const cacheKey = `obtener_${codigoLimpio}`;
    const ahora = Date.now();
    
    if (cacheResultados.has(cacheKey) && 
        cacheTimestamps.has(cacheKey) && 
        (ahora - cacheTimestamps.get(cacheKey)) < API_CONFIG.CACHE_TIEMPO) {
      console.log('📦 Usando resultado en cache para código:', codigoLimpio);
      return cacheResultados.get(cacheKey);
    }
    
    const url = `${API_CONFIG.URL}?action=obtener&codigo=${encodeURIComponent(codigoLimpio)}`;
    
    console.log('🔍 Obteniendo ejecutora:', codigoLimpio);
    
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Ejecutora obtenida:', data);
    
    if (data.success) {
      cacheResultados.set(cacheKey, data);
      cacheTimestamps.set(cacheKey, ahora);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error en obtenerEjecutora:', error);
    return {
      success: false,
      message: 'Error de conexión: ' + error.message
    };
  }
}


// ===== 🆕 GUARDAR TICKET CON JSONP - ✅ OPTIMIZADO =====
async function guardarTicket(datosTicket) {
  try {
    console.log('💾 Guardando ticket...', datosTicket);
    
    // ✅ CONSTRUIR URL CON TODOS LOS PARÁMETROS (INCLUYENDO CORREO COORDINADOR)
    const params = new URLSearchParams({
      action: 'guardarTicket',
      codigoUE: datosTicket.codigoUE || '',
      nombreUE: datosTicket.nombreUE || '',
      coordinadorAbrev: datosTicket.coordinadorAbrev || '',
      correoCoordinador: datosTicket.correoCoordinador || '',
      coordinador: datosTicket.coordinador || '',
      nombreUsuario: datosTicket.nombreUsuario || '',
      cargoUsuario: datosTicket.cargoUsuario || '',
      correoUsuario: datosTicket.correoUsuario || '',
      celularUsuario: datosTicket.celularUsuario || '',
      modulo: datosTicket.modulo || '',
      submodulo: datosTicket.submodulo || '',
      descripcion: datosTicket.descripcion || '',
      analistaDGA: datosTicket.analistaDGA || '',
      // 🆕 PARÁMETRO PARA ENVÍO ASÍNCRONO DE CORREO
      envioAsincrono: 'true'
    });
    
    const url = `${API_CONFIG.URL}?${params.toString()}`;
    
    console.log('📡 Enviando ticket via JSONP...');
    console.log('📧 Correo coordinador:', datosTicket.correoCoordinador);
    
    // ✅ USAR JSONP PARA OBTENER LA RESPUESTA REAL DEL SERVIDOR
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Respuesta del servidor:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error en guardarTicket:', error);
    return {
      success: false,
      message: 'Error al guardar ticket: ' + error.message
    };
  }
}



// ===== 🆕 SUBIR ARCHIVO A GOOGLE DRIVE =====
async function subirArchivoADrive(numeroTicket, archivo) {
  try {
    console.log('📤 Subiendo archivo:', archivo.name);
    console.log('📦 Archivo info:', {
      nombre: archivo.name,
      tipo: archivo.type,
      tamaño: archivo.size
    });
    
    // Convertir archivo a Base64
    const contenidoBase64 = await archivoABase64(archivo);
    
    console.log('✅ Archivo convertido a Base64, longitud:', contenidoBase64.length);
    
    // Preparar datos
    const datos = {
      action: 'subirArchivo',
      numeroTicket: numeroTicket,
      nombreArchivo: archivo.name,
      contenidoBase64: contenidoBase64,
      mimeType: archivo.type
    };
    
    console.log('📡 Enviando archivo al servidor...');
    console.log('🎫 Ticket:', numeroTicket);
    console.log('📄 Nombre:', archivo.name);
    
    // Enviar con POST
    const response = await fetch(API_CONFIG.URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
      mode: 'no-cors' // Importante para evitar CORS con Apps Script
    });
    
    console.log('📨 Respuesta recibida del servidor');
    
    // Como usamos no-cors, no podemos leer la respuesta
    // Asumimos éxito si no hay error
    return {
      success: true,
      message: 'Archivo enviado',
      nombreArchivo: archivo.name
    };
    
  } catch (error) {
    console.error('❌ Error al subir archivo:', error);
    console.error('Stack:', error.stack);
    return {
      success: false,
      message: 'Error al subir archivo: ' + error.message
    };
  }
}

// ===== 🆕 CONVERTIR ARCHIVO A BASE64 =====
function archivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // Extraer solo el contenido base64 (sin el prefijo data:...)
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(archivo);
  });
}

// ===== 🆕 SUBIR MÚLTIPLES ARCHIVOS =====
async function subirMultiplesArchivos(numeroTicket, archivos, onProgress) {
  const resultados = [];
  const total = archivos.length;
  
  console.log(`📤 Iniciando subida de ${total} archivo(s) para ticket ${numeroTicket}`);
  
  for (let i = 0; i < archivos.length; i++) {
    const archivoData = archivos[i];
    
    console.log(`📤 Subiendo archivo ${i + 1}/${total}: ${archivoData.name}`);
    
    // Callback de progreso
    if (onProgress) {
      onProgress(i + 1, total, archivoData.name);
    }
    
    try {
      // ✅ PASAR EL OBJETO FILE REAL, NO EL WRAPPER
      const resultado = await subirArchivoADrive(numeroTicket, archivoData.file);
      resultados.push({
        ...resultado,
        nombreOriginal: archivoData.name
      });
      
      console.log(`✅ Archivo ${i + 1}/${total} procesado:`, resultado.success ? 'ÉXITO' : 'ERROR');
      
    } catch (error) {
      console.error(`❌ Error al subir ${archivoData.name}:`, error);
      resultados.push({
        success: false,
        nombreOriginal: archivoData.name,
        message: error.message
      });
    }
    
    // Pequeña pausa entre archivos para no saturar
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ Subida completada. Resultados:', resultados);
  
  return resultados;
}

// ===== VERIFICAR CONEXIÓN =====
async function verificarConexion() {
  try {
    console.log('🔌 Verificando conexión con Google Sheets...');
    
    const url = `${API_CONFIG.URL}?action=test`;
    
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Conexión exitosa:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return {
      success: false,
      message: 'No se pudo conectar con el servidor: ' + error.message
    };
  }
}

// ===== LIMPIAR CACHE =====
function limpiarCache() {
  cacheResultados.clear();
  cacheTimestamps.clear();
  console.log('🗑️ Cache limpiado');
}

// ===== ESTADÍSTICAS DE CACHE =====
function estadisticasCache() {
  return {
    totalEntradas: cacheResultados.size,
    entradas: Array.from(cacheResultados.keys())
  };
}
// ===== 🆕 OBTENER VERSIONES =====
async function obtenerVersiones() {
  try {
    console.log('📡 Obteniendo versiones desde Google Sheets...');
    
    const url = `${API_CONFIG.URL}?action=obtenerVersiones`;
    
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Versiones obtenidas:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error al obtener versiones:', error);
    return {
      success: false,
      message: 'Error de conexión: ' + error.message,
      versiones: []
    };
  }
}

// ===== VERIFICAR CONEXIÓN =====
async function verificarConexion() {
  try {
    console.log('🔌 Verificando conexión con Google Sheets...');
    
    const url = `${API_CONFIG.URL}?action=test`;
    
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Conexión exitosa:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return {
      success: false,
      message: 'No se pudo conectar con el servidor: ' + error.message
    };
  }
}