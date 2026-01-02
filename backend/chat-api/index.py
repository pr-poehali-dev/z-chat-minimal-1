import json
import os
import psycopg2
from datetime import datetime

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    '''API для работы с чатами и сообщениями Z Chat'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query_params = event.get('queryStringParameters', {}) or {}
        path = query_params.get('path', '')
        user_id = event.get('headers', {}).get('x-user-id', '6')
        
        if method == 'GET' and path == 'chats':
            cur.execute('''
                SELECT DISTINCT c.id, c.name, c.avatar, c.is_group,
                       (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                       (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                       (SELECT COUNT(*) FROM messages m 
                        WHERE m.chat_id = c.id 
                        AND m.sender_id != %s 
                        AND m.status != 'read') as unread_count,
                       cm.pinned, cm.muted,
                       (SELECT online FROM users WHERE id = (
                           SELECT user_id FROM chat_members WHERE chat_id = c.id AND user_id != %s LIMIT 1
                       )) as online
                FROM chats c
                JOIN chat_members cm ON c.id = cm.chat_id
                WHERE cm.user_id = %s
                ORDER BY last_message_time DESC NULLS LAST
            ''', (user_id, user_id, user_id))
            
            chats = []
            for row in cur.fetchall():
                last_time = row[5]
                if last_time:
                    time_str = last_time.strftime('%H:%M')
                else:
                    time_str = ''
                
                chats.append({
                    'id': row[0],
                    'name': row[1],
                    'avatar': row[2],
                    'isGroup': row[3],
                    'lastMessage': row[4] or '',
                    'time': time_str,
                    'unread': row[6] or 0,
                    'pinned': row[7] or False,
                    'muted': row[8] or False,
                    'online': row[9] or False
                })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'chats': chats}),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path.startswith('messages/'):
            chat_id = path.split('/')[-1]
            
            cur.execute('''
                SELECT m.id, m.text, m.created_at, m.sender_id, m.status,
                       ARRAY_AGG(mr.emoji) FILTER (WHERE mr.emoji IS NOT NULL) as reactions
                FROM messages m
                LEFT JOIN message_reactions mr ON m.id = mr.message_id
                WHERE m.chat_id = %s
                GROUP BY m.id, m.text, m.created_at, m.sender_id, m.status
                ORDER BY m.created_at ASC
            ''', (chat_id,))
            
            messages = []
            for row in cur.fetchall():
                messages.append({
                    'id': row[0],
                    'text': row[1],
                    'time': row[2].strftime('%H:%M'),
                    'isOwn': str(row[3]) == str(user_id),
                    'status': row[4],
                    'reactions': row[5] if row[5] else []
                })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'messages':
            body = json.loads(event.get('body', '{}'))
            chat_id = body.get('chatId')
            text = body.get('text', '').strip()
            
            if not text or not chat_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Missing chatId or text'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                INSERT INTO messages (chat_id, sender_id, text, status, created_at)
                VALUES (%s, %s, %s, 'sent', NOW())
                RETURNING id, created_at
            ''', (chat_id, user_id, text))
            
            result = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({
                    'id': result[0],
                    'text': text,
                    'time': result[1].strftime('%H:%M'),
                    'isOwn': True,
                    'status': 'sent',
                    'reactions': []
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path.startswith('messages/') and '/react' in path:
            message_id = path.split('/')[1]
            body = json.loads(event.get('body', '{}'))
            emoji = body.get('emoji')
            
            if not emoji:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Missing emoji'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                INSERT INTO message_reactions (message_id, user_id, emoji)
                VALUES (%s, %s, %s)
                ON CONFLICT (message_id, user_id, emoji) DO NOTHING
            ''', (message_id, user_id, emoji))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Not found'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()