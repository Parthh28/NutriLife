export class NotificationSystem {
  static async sendPush(userId: string, message: string) {
    console.log(`[PUSH NOTIFICATION -> User:${userId}]: ${message}`);
    return true;
  }
}
