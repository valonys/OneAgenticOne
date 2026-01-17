/**
 * Persistent Storage Service for Agent Conversations
 * Handles conversation persistence across sessions using localStorage
 */

class ConversationStorage {
    constructor() {
        this.storageKeyPrefix = "agenticone_conversation_";
        this.userKeyPrefix = "agenticone_user_";
    }

    saveConversationToLocal(userEmail, agentRole, messages) {
        try {
            const storageKey = `${this.storageKeyPrefix}${userEmail}_${agentRole}`;
            const conversationData = {
                user_email: userEmail,
                agent_role: agentRole,
                messages: messages,
                last_updated: new Date().toISOString(),
                message_count: messages.length
            };

            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(storageKey, JSON.stringify(conversationData));
                console.log(`💾 Saved conversation for ${agentRole} (${messages.length} messages)`);
            }
        } catch (error) {
            console.error("Error saving conversation to local storage:", error);
        }
    }

    loadConversationFromLocal(userEmail, agentRole) {
        try {
            const storageKey = `${this.storageKeyPrefix}${userEmail}_${agentRole}`;

            if (typeof window !== 'undefined' && window.localStorage) {
                const storedData = window.localStorage.getItem(storageKey);
                if (storedData) {
                    const conversationData = JSON.parse(storedData);
                    console.log(`📂 Loaded conversation for ${agentRole} (${conversationData.message_count} messages)`);
                    return conversationData.messages || [];
                }
            }
        } catch (error) {
            console.error("Error loading conversation from local storage:", error);
        }

        return null;
    }

    saveUserSession(userEmail, userName, selectedAgent, ragSources, uploadedFiles) {
        try {
            const sessionData = {
                user_email: userEmail,
                user_name: userName,
                selected_agent: selectedAgent,
                rag_sources: ragSources,
                uploaded_files: uploadedFiles,
                last_session: new Date().toISOString()
            };

            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(
                    `${this.userKeyPrefix}${userEmail}`,
                    JSON.stringify(sessionData)
                );
                console.log(`💾 Saved user session for ${userEmail}`);
            }
        } catch (error) {
            console.error("Error saving user session:", error);
        }
    }

    loadUserSession(userEmail) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const storedData = window.localStorage.getItem(`${this.userKeyPrefix}${userEmail}`);
                if (storedData) {
                    const sessionData = JSON.parse(storedData);
                    console.log(`📂 Loaded user session for ${userEmail}`);
                    return sessionData;
                }
            }
        } catch (error) {
            console.error("Error loading user session:", error);
        }

        return null;
    }

    clearUserData(userEmail) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const keysToRemove = [];
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    if (key && (key.startsWith(`${this.storageKeyPrefix}${userEmail}_`) ||
                               key === `${this.userKeyPrefix}${userEmail}`)) {
                        keysToRemove.push(key);
                    }
                }

                keysToRemove.forEach(key => {
                    window.localStorage.removeItem(key);
                });

                console.log(`🗑️ Cleared user data for ${userEmail}`);
            }
        } catch (error) {
            console.error("Error clearing user data:", error);
        }
    }

    getAllUserConversations(userEmail) {
        const conversations = {};

        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    if (key && key.startsWith(`${this.storageKeyPrefix}${userEmail}_`)) {
                        const agentRole = key.split('_').pop(); // Extract agent role
                        const storedData = window.localStorage.getItem(key);
                        if (storedData) {
                            const conversationData = JSON.parse(storedData);
                            conversations[agentRole] = conversationData.messages || [];
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error getting all user conversations:", error);
        }

        return conversations;
    }

    getConversationStats(userEmail) {
        const conversations = this.getAllUserConversations(userEmail);
        const stats = {
            total_conversations: Object.keys(conversations).length,
            total_messages: 0,
            agents_used: Object.keys(conversations),
            last_activity: null
        };

        Object.values(conversations).forEach(messages => {
            stats.total_messages += messages.length;
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                const messageTime = new Date(lastMessage.timestamp);
                if (!stats.last_activity || messageTime > new Date(stats.last_activity)) {
                    stats.last_activity = lastMessage.timestamp;
                }
            }
        });

        return stats;
    }
}

// Global instance
const conversationStorage = new ConversationStorage();

// Export for use in React components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConversationStorage, conversationStorage };
} else if (typeof window !== 'undefined') {
    window.conversationStorage = conversationStorage;
}