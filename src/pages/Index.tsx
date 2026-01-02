import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: number;
  text: string;
  time: string;
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
  reactions?: string[];
};

type Chat = {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
  pinned?: boolean;
  muted?: boolean;
};

const Index = () => {
  const [activeSection, setActiveSection] = useState<'chats' | 'contacts' | 'channels' | 'archive' | 'profile' | 'settings'>('chats');
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const loadChats = async () => {
    try {
      const data = await api.getChats();
      setChats(data.chats);
      if (data.chats.length > 0 && !selectedChat) {
        setSelectedChat(data.chats[0].id);
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить чаты', variant: 'destructive' });
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const data = await api.getMessages(chatId);
      setMessages(data.messages);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить сообщения', variant: 'destructive' });
    }
  };

  const handleSendMessage = async () => {
    if (messageText.trim() && selectedChat) {
      try {
        const newMessage = await api.sendMessage(selectedChat, messageText);
        setMessages([...messages, newMessage]);
        setMessageText('');
        await loadChats();
      } catch (error) {
        toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
      }
    }
  };

  const contacts = [
    { id: 1, name: 'Анна Соколова', avatar: '👩‍💼', status: 'онлайн' },
    { id: 2, name: 'Максим Петров', avatar: '👨‍🎨', status: 'онлайн' },
    { id: 3, name: 'Елена Иванова', avatar: '👩‍🔬', status: 'был(а) 2 часа назад' },
    { id: 4, name: 'Дмитрий Сидоров', avatar: '👨‍💻', status: 'был(а) вчера' },
  ];

  const channels = [
    { id: 1, name: 'Новости технологий', avatar: '📱', subscribers: '12.5K' },
    { id: 2, name: 'Дизайн и UX', avatar: '🎨', subscribers: '8.2K' },
    { id: 3, name: 'Стартапы России', avatar: '🚀', subscribers: '25.1K' },
  ];

  const renderSidebarContent = () => {
    switch (activeSection) {
      case 'chats':
        return (
          <div className="flex-1 overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input placeholder="Поиск чатов..." className="pl-10" />
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-140px)]">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={cn(
                    'flex items-center gap-3 p-4 hover:bg-accent/50 cursor-pointer transition-colors border-b',
                    selectedChat === chat.id && 'bg-accent/30'
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-2xl">{chat.avatar}</AvatarFallback>
                    </Avatar>
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{chat.name}</span>
                        {chat.pinned && <Icon name="Pin" size={14} className="text-primary" />}
                        {chat.muted && <Icon name="BellOff" size={14} className="text-muted-foreground" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                      {chat.unread && chat.unread > 0 && (
                        <Badge variant="default" className="ml-2 rounded-full h-5 min-w-5 px-1.5 text-xs">
                          {chat.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        );

      case 'contacts':
        return (
          <div className="flex-1 overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg mb-3">Контакты</h2>
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input placeholder="Найти контакт..." className="pl-10" />
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-180px)]">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-4 hover:bg-accent/50 cursor-pointer transition-colors border-b">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-2xl">{contact.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.status}</p>
                  </div>
                  <Button size="icon" variant="ghost">
                    <Icon name="MessageCircle" size={18} />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>
        );

      case 'channels':
        return (
          <div className="flex-1 overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg mb-3">Каналы</h2>
              <Button className="w-full" size="sm">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать канал
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-180px)]">
              {channels.map((channel) => (
                <div key={channel.id} className="flex items-center gap-3 p-4 hover:bg-accent/50 cursor-pointer transition-colors border-b">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-2xl">{channel.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">{channel.subscribers} подписчиков</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        );

      case 'archive':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <Icon name="Archive" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">Архив пуст</h3>
              <p className="text-sm text-muted-foreground">Архивированные чаты появятся здесь</p>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="flex-1 overflow-hidden">
            <div className="p-6 border-b text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarFallback className="text-4xl">👤</AvatarFallback>
              </Avatar>
              <h2 className="font-bold text-xl mb-1">Вы</h2>
              <p className="text-sm text-muted-foreground">@username</p>
              <Button variant="outline" size="sm" className="mt-4">
                Редактировать профиль
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer">
                  <Icon name="User" size={20} />
                  <span className="text-sm">Мой аккаунт</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer">
                  <Icon name="Bell" size={20} />
                  <span className="text-sm">Уведомления</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer">
                  <Icon name="Lock" size={20} />
                  <span className="text-sm">Приватность</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer" onClick={toggleDarkMode}>
                  <Icon name="Palette" size={20} />
                  <span className="text-sm">Темы оформления</span>
                  <span className="ml-auto text-xs text-muted-foreground">{isDarkMode ? 'Темная' : 'Светлая'}</span>
                </div>
              </div>
            </ScrollArea>
          </div>
        );

      case 'settings':
        return (
          <div className="flex-1 overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg">Настройки</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer" onClick={toggleDarkMode}>
                  <Icon name="Monitor" size={20} />
                  <span className="text-sm">Внешний вид</span>
                  <span className="ml-auto text-xs text-muted-foreground">{isDarkMode ? '🌙' : '☀️'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer">
                  <Icon name="Languages" size={20} />
                  <span className="text-sm">Язык</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer">
                  <Icon name="Database" size={20} />
                  <span className="text-sm">Данные и хранилище</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer">
                  <Icon name="Shield" size={20} />
                  <span className="text-sm">Безопасность</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer">
                  <Icon name="Info" size={20} />
                  <span className="text-sm">О приложении</span>
                </div>
              </div>
            </ScrollArea>
          </div>
        );

      default:
        return null;
    }
  };

  const selectedChatData = chats.find(c => c.id === selectedChat);

  return (
    <div className="flex h-screen bg-background">
      <div className="w-16 bg-card border-r flex flex-col items-center py-4 gap-2">
        <Button
          variant={activeSection === 'chats' ? 'default' : 'ghost'}
          size="icon"
          className="rounded-xl"
          onClick={() => setActiveSection('chats')}
        >
          <Icon name="MessageSquare" size={20} />
        </Button>
        <Button
          variant={activeSection === 'contacts' ? 'default' : 'ghost'}
          size="icon"
          className="rounded-xl"
          onClick={() => setActiveSection('contacts')}
        >
          <Icon name="Users" size={20} />
        </Button>
        <Button
          variant={activeSection === 'channels' ? 'default' : 'ghost'}
          size="icon"
          className="rounded-xl"
          onClick={() => setActiveSection('channels')}
        >
          <Icon name="Radio" size={20} />
        </Button>
        <Button
          variant={activeSection === 'archive' ? 'default' : 'ghost'}
          size="icon"
          className="rounded-xl"
          onClick={() => setActiveSection('archive')}
        >
          <Icon name="Archive" size={20} />
        </Button>
        <div className="flex-1" />
        <Button
          variant={activeSection === 'profile' ? 'default' : 'ghost'}
          size="icon"
          className="rounded-xl"
          onClick={() => setActiveSection('profile')}
        >
          <Icon name="User" size={20} />
        </Button>
        <Button
          variant={activeSection === 'settings' ? 'default' : 'ghost'}
          size="icon"
          className="rounded-xl"
          onClick={() => setActiveSection('settings')}
        >
          <Icon name="Settings" size={20} />
        </Button>
      </div>

      <div className="w-80 bg-card border-r flex flex-col">
        {renderSidebarContent()}
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="h-16 bg-card border-b flex items-center px-6 gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-xl">{selectedChatData?.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{selectedChatData?.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedChatData?.online ? 'онлайн' : 'был(а) недавно'}
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <Icon name="Phone" size={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <Icon name="Video" size={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <Icon name="MoreVertical" size={20} />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn('flex', msg.isOwn ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-md px-4 py-2 rounded-2xl group relative',
                        msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                      )}
                    >
                      <p className="text-sm mb-1">{msg.text}</p>
                      <div className="flex items-center gap-1 justify-end">
                        <span className={cn('text-xs', msg.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                          {msg.time}
                        </span>
                        {msg.isOwn && msg.status === 'read' && (
                          <Icon name="CheckCheck" size={14} className="text-primary-foreground/70" />
                        )}
                        {msg.isOwn && msg.status === 'delivered' && (
                          <Icon name="Check" size={14} className="text-primary-foreground/70" />
                        )}
                      </div>
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="absolute -bottom-2 right-2 flex gap-1 bg-background border rounded-full px-2 py-0.5 shadow-sm">
                          {msg.reactions.map((emoji, idx) => (
                            <span key={idx} className="text-xs">
                              {emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 bg-card border-t">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <Button variant="ghost" size="icon">
                  <Icon name="Paperclip" size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="Smile" size={20} />
                </Button>
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Написать сообщение..."
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Icon name="Mic" size={20} />
                </Button>
                <Button size="icon" onClick={handleSendMessage}>
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h2 className="font-semibold text-xl mb-2">Выберите чат</h2>
              <p className="text-muted-foreground">Начните общение из списка чатов</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
