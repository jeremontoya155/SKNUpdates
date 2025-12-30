// Notificaciones Web para el Dashboard
// Archivo: public/js/notifications.js

class WebNotifications {
  constructor() {
    this.permission = 'default';
    this.checkPermission();
  }

  // Verificar permiso actual
  checkPermission() {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return false;
    }
    this.permission = Notification.permission;
    return this.permission === 'granted';
  }

  // Solicitar permiso
  async requestPermission() {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    if (permission === 'granted') {
      this.showNotification('Notificaciones activadas', 'Recibirás alertas de nuevos tickets', 'success');
      return true;
    } else {
      alert('Necesitas habilitar las notificaciones para recibir alertas');
      return false;
    }
  }

  // Mostrar notificación
  showNotification(title, message, type = 'info') {
    if (this.permission !== 'granted') {
      console.log('No hay permiso para mostrar notificaciones');
      return;
    }

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      ticket: '🎫'
    };

    const options = {
      body: message,
      icon: '/img/logo.png', // Ajusta la ruta a tu logo
      badge: '/img/badge.png',
      tag: `notification-${Date.now()}`,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      data: {
        timestamp: new Date().toISOString(),
        type: type
      }
    };

    const notification = new Notification(`${icons[type] || '🔔'} ${title}`, options);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => notification.close(), 5000);

    // Reproducir sonido
    this.playSound(type);

    // Evento al hacer click
    notification.onclick = function(event) {
      event.preventDefault();
      window.focus();
      notification.close();
    };

    return notification;
  }

  // Reproducir sonido
  playSound(type) {
    const audio = new Audio();
    
    // Puedes usar diferentes sonidos según el tipo
    if (type === 'ticket' || type === 'warning') {
      // Sonido de notificación (frecuencia más alta para urgente)
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSBAQU6vo8LVXGAY9k9nzy3opBSh+zPLekzoIGWe57OihUQ0NTKXm8LFYGgU5j9bzzHkqBSh8yfLejDoIGGW58OafTw0NTaXl8LJaGQU5j9Xxzn0sBSh8yPLdkD0KF2O36+mgUQ0LTKTk7rJbGgY4jtPxy3srBSl7xvHfkz4KF2K26uqgUAwLS6Pj8LJbGgU4jdPyy30rBSh6xfHekz0IFmC16OmiTwwLSqLi77JbGQU4jdLxy3wrBSh6xPDekzsIFV+z5+mjTwwKSaHh7rFbGQU3i9Hwy30rBSl5w+/dkzwIFV6y5umiTwwKSKDh7rBaGAU3i9DvzHwrBSp4wu/dkzsIFF2x5emhTgsJR5/g7rBaGAU2is/uzHsrBSt3we7dkjoIFF2w5OmgTgkIRp7f7bBZGAU2ic7uzHsqBSx2v+3ckTkHE1yv4+mgTQgJRp7f7a9ZFwU1iM3ty3oqBi12vu3bkDgGElyw4+qfTQcJRp7e7a5YFQU0h8zsy3kpBi50vezdkDYGEVuv4umeTAcIRZ3d7K1XFAU0h8rry3koBS10vOzajzUFEFqu4emcSwYIRJ3c66xWFAQzh8nqyncoBS5zu+vZjjQEEFmt3+mbSQUIQ5zb6qtVEwMzhsjpyXYnBS1yuevXjDMEEFas3eiaSAQIQpvZ6apUEgMyhcfnyHUmBCxwt+rWijEDDlWq3OeYRwQHQZrY6KlTEgIxhMbmx3QlBCttt+nUiDADDlSp2+aXRgMHQJrW56lTEQIwhMXlxnMkBCpstujThi8CDVOo2uWWRQMGP5nV5ahSEQIvg8TkxXIjBClqtOfSaC0CDFKn2eSVRAIGPpjT5KdREQEug8PjxHEiBShnsuXRhiwBDFCm1+KUQwIFPZfS46ZQEAAtgcLiw3AhBSdlseTQhSsBD0+l1eGTQgEEPJbR4qVPDwAsvKHhwW4gBCZjr+LOgykBC06k090SQA==';
    } else {
      // Sonido más suave para info
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSBAQY6vo8LVXGAY9k9nzy3opBSh+zPLekzoIGWe57OihUQ0NTKXm8LFYGgU5j9bzzHkqBSh8yfLejDoIGGW58OafTw0NTaXl8LJaGQU5j9Xxzn0sBSh8yPLdkD0KF2O36+mgUQ0LTKTk7rJbGgY4jtPxy3srBSl7xvHfkz4KF2K26uqgUAwLS6Pj8LJbGgU4jdPyy30rBSh6xfHekz0IFmC16OmiTwwLSqLi77JbGQU4jdLxy3wrBSh6xPDekzsIFV+z5+mjTwwKSaHh7rFbGQU3i9Hwy30rBSl5w+/dkzwIFV6y5umiTwwKSKDh7rBaGAU3i9DvzHwrBSp4wu/dkzsIFF2x5emhTgsJR5/g7rBaGAU2is/uzHsrBSt3we7dkjoIFF2w5OmgTgkIRp7f7bBZGAU2ic7uzHsqBSx2v+3ckTkHE1yv4+mgTQgJRp7f7a9ZFwU1iM3ty3oqBi12vu3bkDgGElyw4+qfTQcJRp7e7a5YFQU0h8zsy3kpBi50vezdkDYGEVuv4umeTAcIRZ3d7K1XFAU0h8rry3koBS10vOzajzUFEFqu4emcSwYIRJ3c66xWFAQzh8nqyncoBS5zu+vZjjQEEFmt3+mbSQUIQ5zb6qtVEwMzhsjpyXYnBS1yuevXjDMEEFas3eiaSAQIQpvZ6apUEgMyhcfnyHUmBCxwt+rWijEDDlWq3OeYRwQHQZrY6KlTEgIxhMbmx3QlBCttt+nUiDADDlSp2+aXRgMHQJrW56lTEQIwhMXlxnMkBCpstujThi8CDVOo2uWWRQMGP5nV5ahSEQIvg8TkxXIjBClqtOfSaC0CDFKn2eSVRAIGPpjT5KdREQEug8PjxHEiBShnsuXRhiwBDFCm1+KUQwIFPZfS46ZQEAAtgcLiw3AhBSdlseTQhSsBD0+l1eGTQgEEPJbR4qVPDwAsvcHhwW4gBCZjr+LOgykBC06k090SQA==';
    }
    
    audio.volume = 0.3;
    audio.play().catch(err => console.log('No se pudo reproducir el sonido'));
  }

  // Notificación específica para nuevo ticket
  notifyNewTicket(ticketId, title, priority = 'media') {
    const priorityText = {
      alta: 'URGENTE',
      media: 'Prioridad Media',
      baja: 'Baja Prioridad'
    };

    const message = `${priorityText[priority]}\nTicket #${ticketId}: ${title}`;
    this.showNotification('Nuevo Ticket Asignado', message, 'ticket');
  }

  // Notificación de ticket actualizado
  notifyTicketUpdate(ticketId, newStatus) {
    const statusText = {
      'abierto': 'Abierto',
      'en_proceso': 'En Proceso',
      'cerrado': 'Cerrado',
      'finalizado': 'Finalizado'
    };

    const message = `Ticket #${ticketId} ahora está: ${statusText[newStatus] || newStatus}`;
    this.showNotification('Ticket Actualizado', message, 'info');
  }
}

// Crear instancia global
window.webNotifications = new WebNotifications();

// Botón para activar notificaciones
document.addEventListener('DOMContentLoaded', function() {
  // Crear botón flotante para habilitar notificaciones
  const notifBtn = document.createElement('button');
  notifBtn.id = 'enable-notifications-btn';
  notifBtn.innerHTML = '🔔';
  notifBtn.title = 'Habilitar notificaciones';
  notifBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #2196F3;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    z-index: 1000;
    transition: all 0.3s;
  `;

  notifBtn.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.1)';
  });

  notifBtn.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
  });

  notifBtn.addEventListener('click', async function() {
    const granted = await window.webNotifications.requestPermission();
    if (granted) {
      this.innerHTML = '🔔✓';
      this.style.background = '#4CAF50';
      setTimeout(() => {
        this.style.display = 'none';
      }, 2000);
    }
  });

  // Solo mostrar si no hay permiso
  if (Notification.permission !== 'granted') {
    document.body.appendChild(notifBtn);
  }
});

// Polling para nuevos tickets (cada 30 segundos)
let lastTicketCount = 0;

async function checkForNewTickets() {
  try {
    const response = await fetch('/api/tickets/count');
    const data = await response.json();
    
    if (lastTicketCount > 0 && data.count > lastTicketCount) {
      // Hay nuevos tickets
      const newTicketsCount = data.count - lastTicketCount;
      window.webNotifications.showNotification(
        'Nuevos Tickets',
        `Hay ${newTicketsCount} ticket(s) nuevo(s)`,
        'ticket'
      );
    }
    
    lastTicketCount = data.count;
  } catch (error) {
    console.error('Error checking tickets:', error);
  }
}

// Iniciar polling si hay permiso
if (Notification.permission === 'granted') {
  // Primera verificación después de 5 segundos
  setTimeout(() => {
    checkForNewTickets();
    // Luego cada 30 segundos
    setInterval(checkForNewTickets, 30000);
  }, 5000);
}
