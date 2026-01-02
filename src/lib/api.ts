const API_URL = 'https://functions.poehali.dev/69b23792-24a9-4d90-a6d6-01661143073b';
const USER_ID = '6';

export const api = {
  async getChats() {
    const response = await fetch(`${API_URL}?path=chats`, {
      headers: {
        'X-User-Id': USER_ID,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch chats');
    return response.json();
  },

  async getMessages(chatId: number) {
    const response = await fetch(`${API_URL}?path=messages/${chatId}`, {
      headers: {
        'X-User-Id': USER_ID,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async sendMessage(chatId: number, text: string) {
    const response = await fetch(`${API_URL}?path=messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': USER_ID,
      },
      body: JSON.stringify({ chatId, text }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async addReaction(messageId: number, emoji: string) {
    const response = await fetch(`${API_URL}?path=messages/${messageId}/react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': USER_ID,
      },
      body: JSON.stringify({ emoji }),
    });
    if (!response.ok) throw new Error('Failed to add reaction');
    return response.json();
  },
};
