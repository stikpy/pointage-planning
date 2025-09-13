// Service de notifications push pour l'application
import React from 'react';

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  public isSupported: boolean;
  private permission: NotificationPermission;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  // Initialiser le service de notifications
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications non supportées');
      return false;
    }

    try {
      // Enregistrer le service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré:', this.serviceWorkerRegistration);
      return true;
    } catch (error) {
      console.error('Erreur enregistrement Service Worker:', error);
      return false;
    }
  }

  // Demander la permission pour les notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notifications non supportées');
    }

    if (this.permission === 'granted') {
      return this.permission;
    }

    this.permission = await Notification.requestPermission();
    return this.permission;
  }

  // Vérifier si les notifications sont autorisées
  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  // Envoyer une notification locale
  async showNotification(data: NotificationData): Promise<void> {
    if (!this.isSupported || !this.isPermissionGranted()) {
      throw new Error('Notifications non autorisées');
    }

    const notificationOptions: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      // image: data.image, // Non supporté par NotificationOptions
      data: data.data,
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      // timestamp: data.timestamp || Date.now(), // Non supporté par NotificationOptions
      // actions: data.actions?.map(action => ({ // Non supporté par NotificationOptions
      //   action: action.action,
      //   title: action.title,
      //   icon: action.icon
      // }))
    };

    if (this.serviceWorkerRegistration) {
      // Utiliser le service worker pour afficher la notification
      await this.serviceWorkerRegistration.showNotification(data.title, notificationOptions);
    } else {
      // Fallback vers l'API native
      new Notification(data.title, notificationOptions);
    }
  }

  // S'abonner aux notifications push
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service Worker non enregistré');
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVapidPublicKey()
      });

      // Envoyer l'abonnement au serveur
      await this.sendSubscriptionToServer(subscription as any);
      
      return subscription as any;
    } catch (error) {
      console.error('Erreur abonnement push:', error);
      return null;
    }
  }

  // Se désabonner des notifications push
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription as any);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur désabonnement push:', error);
      return false;
    }
  }

  // Obtenir la clé publique VAPID
  private getVapidPublicKey(): string {
    // En production, cette clé devrait être dans les variables d'environnement
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HI0YyQYdRq1V8VgM7d1zT-wqKje1MKJt8V7h0L8HL8KjewKmYvtuoXGUqE';
  }

  // Envoyer l'abonnement au serveur
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: (subscription as any).toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Erreur envoi abonnement au serveur');
      }
    } catch (error) {
      console.error('Erreur envoi abonnement:', error);
      throw error;
    }
  }

  // Supprimer l'abonnement du serveur
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });
    } catch (error) {
      console.error('Erreur suppression abonnement:', error);
    }
  }

  // Notifications spécifiques au pointage
  async notifyClockIn(employeeName: string, timestamp: Date): Promise<void> {
    await this.showNotification({
      title: 'Pointage d\'entrée',
      body: `${employeeName} a pointé l'entrée à ${timestamp.toLocaleTimeString('fr-FR')}`,
      icon: '/icons/clock-in.png',
      data: {
        type: 'clock_in',
        employeeName,
        timestamp: timestamp.toISOString()
      },
      actions: [
        {
          action: 'view',
          title: 'Voir détails',
          icon: '/icons/view.png'
        }
      ]
    });
  }

  async notifyClockOut(employeeName: string, timestamp: Date, duration: string): Promise<void> {
    await this.showNotification({
      title: 'Pointage de sortie',
      body: `${employeeName} a pointé la sortie. Durée: ${duration}`,
      icon: '/icons/clock-out.png',
      data: {
        type: 'clock_out',
        employeeName,
        timestamp: timestamp.toISOString(),
        duration
      },
      actions: [
        {
          action: 'view',
          title: 'Voir détails',
          icon: '/icons/view.png'
        }
      ]
    });
  }

  async notifyBreakStart(employeeName: string): Promise<void> {
    await this.showNotification({
      title: 'Pause démarrée',
      body: `${employeeName} a commencé sa pause`,
      icon: '/icons/break.png',
      data: {
        type: 'break_start',
        employeeName,
        timestamp: new Date().toISOString()
      }
    });
  }

  async notifyBreakEnd(employeeName: string): Promise<void> {
    await this.showNotification({
      title: 'Pause terminée',
      body: `${employeeName} a terminé sa pause`,
      icon: '/icons/work.png',
      data: {
        type: 'break_end',
        employeeName,
        timestamp: new Date().toISOString()
      }
    });
  }

  async notifyOvertime(employeeName: string, hours: number): Promise<void> {
    await this.showNotification({
      title: 'Heures supplémentaires',
      body: `${employeeName} a dépassé ses heures normales (+${hours}h)`,
      icon: '/icons/overtime.png',
      data: {
        type: 'overtime',
        employeeName,
        hours,
        timestamp: new Date().toISOString()
      },
      requireInteraction: true,
      actions: [
        {
          action: 'approve',
          title: 'Approuver',
          icon: '/icons/approve.png'
        },
        {
          action: 'reject',
          title: 'Rejeter',
          icon: '/icons/reject.png'
        }
      ]
    });
  }

  async notifyScheduleChange(employeeName: string, newSchedule: string): Promise<void> {
    await this.showNotification({
      title: 'Planning modifié',
      body: `Nouveau planning pour ${employeeName}: ${newSchedule}`,
      icon: '/icons/schedule.png',
      data: {
        type: 'schedule_change',
        employeeName,
        newSchedule,
        timestamp: new Date().toISOString()
      },
      actions: [
        {
          action: 'view_schedule',
          title: 'Voir planning',
          icon: '/icons/calendar.png'
        }
      ]
    });
  }

  async notifySystemAlert(message: string, severity: 'info' | 'warning' | 'error'): Promise<void> {
    const icons = {
      info: '/icons/info.png',
      warning: '/icons/warning.png',
      error: '/icons/error.png'
    };

    await this.showNotification({
      title: 'Alerte système',
      body: message,
      icon: icons[severity],
      data: {
        type: 'system_alert',
        severity,
        message,
        timestamp: new Date().toISOString()
      },
      requireInteraction: severity === 'error'
    });
  }

  // Gérer les clics sur les notifications
  setupNotificationClickHandler(): void {
    if (!this.serviceWorkerRegistration) return;

    this.serviceWorkerRegistration.addEventListener('notificationclick', (event: any) => {
      event.notification.close();

      const data = event.notification.data;
      
      if (event.action) {
        // Action spécifique cliquée
        this.handleNotificationAction(event.action, data);
      } else {
        // Notification cliquée directement
        this.handleNotificationClick(data);
      }
    });
  }

  private handleNotificationClick(data: any): void {
    // Rediriger vers la page appropriée selon le type de notification
    switch (data.type) {
      case 'clock_in':
      case 'clock_out':
        window.open('/mobile/clock', '_blank');
        break;
      case 'schedule_change':
        window.open('/mobile/schedule', '_blank');
        break;
      case 'system_alert':
        window.open('/mobile/alerts', '_blank');
        break;
      default:
        window.open('/mobile', '_blank');
    }
  }

  private handleNotificationAction(action: string, data: any): void {
    switch (action) {
      case 'approve':
        // Approuver les heures supplémentaires
        fetch('/api/shifts/approve-overtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: data.employeeName, approved: true })
        });
        break;
      case 'reject':
        // Rejeter les heures supplémentaires
        fetch('/api/shifts/approve-overtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: data.employeeName, approved: false })
        });
        break;
      case 'view':
        // Voir les détails
        window.open(`/mobile/shift-details/${data.timestamp}`, '_blank');
        break;
      case 'view_schedule':
        // Voir le planning
        window.open('/mobile/schedule', '_blank');
        break;
    }
  }

  // Obtenir les statistiques des notifications
  getNotificationStats(): {
    totalSent: number;
    totalClicked: number;
    clickRate: number;
    lastSent: Date | null;
  } {
    // En production, ces statistiques seraient stockées et calculées
    return {
      totalSent: 0,
      totalClicked: 0,
      clickRate: 0,
      lastSent: null
    };
  }
}

// Instance singleton
export const notificationService = new NotificationService();

// Hook React pour les notifications
export function useNotifications() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const initializeNotifications = async () => {
      const supported = notificationService.isSupported;
      setIsSupported(supported);

      if (supported) {
        const initialized = await notificationService.initialize();
        setIsInitialized(initialized);
        
        if (initialized) {
          notificationService.setupNotificationClickHandler();
        }
      }
    };

    initializeNotifications();
  }, []);

  const requestPermission = React.useCallback(async () => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  const showNotification = React.useCallback(async (data: NotificationData) => {
    await notificationService.showNotification(data);
  }, []);

  const subscribeToPush = React.useCallback(async () => {
    return await notificationService.subscribeToPush();
  }, []);

  const unsubscribeFromPush = React.useCallback(async () => {
    return await notificationService.unsubscribeFromPush();
  }, []);

  return {
    isSupported,
    permission,
    isInitialized,
    requestPermission,
    showNotification,
    subscribeToPush,
    unsubscribeFromPush,
    isPermissionGranted: notificationService.isPermissionGranted()
  };
}