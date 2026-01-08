// ═══════════════════════════════════════════════════════════════
// Popular Subscription Apps with Brand Icons
// Icons from Simple Icons CDN (https://simpleicons.org/)
// ═══════════════════════════════════════════════════════════════

export interface SubscriptionApp {
    id: string;
    name: string;
    icon: string;
    category: string;
    color: string;
    suggestedPrice?: number;
}

export const SUBSCRIPTION_CATEGORIES = [
    'Todos',
    'Streaming',
    'Música',
    'Gaming',
    'IA & Productividad',
    'Cloud & Storage',
    'Noticias & Lectura',
    'Fitness & Salud',
    'Educación',
    'Diseño & Creatividad',
    'Comunicación',
    'Finanzas',
    'Seguridad',
    'Otros'
] as const;

export type SubscriptionCategory = typeof SUBSCRIPTION_CATEGORIES[number];

// 100 Popular Subscription Apps
export const SUBSCRIPTION_APPS: SubscriptionApp[] = [
    // ═══════════════════════════════════════════════════════════════
    // STREAMING (Video)
    // ═══════════════════════════════════════════════════════════════
    { id: 'netflix', name: 'Netflix', icon: 'https://cdn.simpleicons.org/netflix/E50914', category: 'Streaming', color: '#E50914' },
    { id: 'disney-plus', name: 'Disney+', icon: 'https://cdn.simpleicons.org/disneyplus/113CCF', category: 'Streaming', color: '#113CCF' },
    { id: 'amazon-prime', name: 'Amazon Prime Video', icon: 'https://cdn.simpleicons.org/amazonprime/00A8E1', category: 'Streaming', color: '#00A8E1' },
    { id: 'hbo-max', name: 'Max (HBO)', icon: 'https://cdn.simpleicons.org/hbo/000000', category: 'Streaming', color: '#5822B4' },
    { id: 'hulu', name: 'Hulu', icon: 'https://cdn.simpleicons.org/hulu/1CE783', category: 'Streaming', color: '#1CE783' },
    { id: 'paramount-plus', name: 'Paramount+', icon: 'https://cdn.simpleicons.org/paramount/0064FF', category: 'Streaming', color: '#0064FF' },
    { id: 'apple-tv', name: 'Apple TV+', icon: 'https://cdn.simpleicons.org/appletv/000000', category: 'Streaming', color: '#000000' },
    { id: 'peacock', name: 'Peacock', icon: 'https://cdn.simpleicons.org/peacock/000000', category: 'Streaming', color: '#000000' },
    { id: 'crunchyroll', name: 'Crunchyroll', icon: 'https://cdn.simpleicons.org/crunchyroll/F47521', category: 'Streaming', color: '#F47521' },
    { id: 'youtube-premium', name: 'YouTube Premium', icon: 'https://cdn.simpleicons.org/youtube/FF0000', category: 'Streaming', color: '#FF0000' },
    { id: 'twitch', name: 'Twitch', icon: 'https://cdn.simpleicons.org/twitch/9146FF', category: 'Streaming', color: '#9146FF' },
    { id: 'vix', name: 'ViX Premium', icon: 'https://cdn.simpleicons.org/televisa/FF6B00', category: 'Streaming', color: '#FF6B00' },
    { id: 'star-plus', name: 'Star+', icon: 'https://cdn.simpleicons.org/starplus/C724C7', category: 'Streaming', color: '#C724C7' },
    { id: 'mubi', name: 'MUBI', icon: 'https://cdn.simpleicons.org/mubi/000000', category: 'Streaming', color: '#000000' },
    { id: 'plex', name: 'Plex Pass', icon: 'https://cdn.simpleicons.org/plex/EBAF00', category: 'Streaming', color: '#EBAF00' },

    // ═══════════════════════════════════════════════════════════════
    // MÚSICA
    // ═══════════════════════════════════════════════════════════════
    { id: 'spotify', name: 'Spotify', icon: 'https://cdn.simpleicons.org/spotify/1DB954', category: 'Música', color: '#1DB954' },
    { id: 'apple-music', name: 'Apple Music', icon: 'https://cdn.simpleicons.org/applemusic/FA243C', category: 'Música', color: '#FA243C' },
    { id: 'youtube-music', name: 'YouTube Music', icon: 'https://cdn.simpleicons.org/youtubemusic/FF0000', category: 'Música', color: '#FF0000' },
    { id: 'amazon-music', name: 'Amazon Music', icon: 'https://cdn.simpleicons.org/amazonmusic/00A8E1', category: 'Música', color: '#00A8E1' },
    { id: 'tidal', name: 'Tidal', icon: 'https://cdn.simpleicons.org/tidal/000000', category: 'Música', color: '#000000' },
    { id: 'deezer', name: 'Deezer', icon: 'https://cdn.simpleicons.org/deezer/FEAA2D', category: 'Música', color: '#FEAA2D' },
    { id: 'soundcloud', name: 'SoundCloud Go', icon: 'https://cdn.simpleicons.org/soundcloud/FF5500', category: 'Música', color: '#FF5500' },
    { id: 'audible', name: 'Audible', icon: 'https://cdn.simpleicons.org/audible/F8991C', category: 'Música', color: '#F8991C' },
    { id: 'pandora', name: 'Pandora', icon: 'https://cdn.simpleicons.org/pandora/224099', category: 'Música', color: '#224099' },

    // ═══════════════════════════════════════════════════════════════
    // GAMING
    // ═══════════════════════════════════════════════════════════════
    { id: 'xbox-game-pass', name: 'Xbox Game Pass', icon: 'https://cdn.simpleicons.org/xbox/107C10', category: 'Gaming', color: '#107C10' },
    { id: 'playstation-plus', name: 'PlayStation Plus', icon: 'https://cdn.simpleicons.org/playstation/003791', category: 'Gaming', color: '#003791' },
    { id: 'nintendo-online', name: 'Nintendo Switch Online', icon: 'https://cdn.simpleicons.org/nintendoswitch/E60012', category: 'Gaming', color: '#E60012' },
    { id: 'ea-play', name: 'EA Play', icon: 'https://cdn.simpleicons.org/ea/000000', category: 'Gaming', color: '#000000' },
    { id: 'ubisoft-plus', name: 'Ubisoft+', icon: 'https://cdn.simpleicons.org/ubisoft/000000', category: 'Gaming', color: '#000000' },
    { id: 'geforce-now', name: 'GeForce NOW', icon: 'https://cdn.simpleicons.org/nvidia/76B900', category: 'Gaming', color: '#76B900' },
    { id: 'steam', name: 'Steam (suscripciones)', icon: 'https://cdn.simpleicons.org/steam/000000', category: 'Gaming', color: '#000000' },
    { id: 'discord-nitro', name: 'Discord Nitro', icon: 'https://cdn.simpleicons.org/discord/5865F2', category: 'Gaming', color: '#5865F2' },
    { id: 'humble-bundle', name: 'Humble Choice', icon: 'https://cdn.simpleicons.org/humblebundle/CC2929', category: 'Gaming', color: '#CC2929' },

    // ═══════════════════════════════════════════════════════════════
    // IA & PRODUCTIVIDAD
    // ═══════════════════════════════════════════════════════════════
    { id: 'chatgpt', name: 'ChatGPT Plus', icon: 'https://cdn.simpleicons.org/openai/412991', category: 'IA & Productividad', color: '#412991' },
    { id: 'claude', name: 'Claude Pro', icon: 'https://cdn.simpleicons.org/anthropic/191919', category: 'IA & Productividad', color: '#D4A27F' },
    { id: 'github-copilot', name: 'GitHub Copilot', icon: 'https://cdn.simpleicons.org/github/181717', category: 'IA & Productividad', color: '#181717' },
    { id: 'notion', name: 'Notion', icon: 'https://cdn.simpleicons.org/notion/000000', category: 'IA & Productividad', color: '#000000' },
    { id: 'microsoft-365', name: 'Microsoft 365', icon: 'https://cdn.simpleicons.org/microsoft/5E5E5E', category: 'IA & Productividad', color: '#D83B01' },
    { id: 'google-one', name: 'Google One', icon: 'https://cdn.simpleicons.org/google/4285F4', category: 'IA & Productividad', color: '#4285F4' },
    { id: 'grammarly', name: 'Grammarly Premium', icon: 'https://cdn.simpleicons.org/grammarly/15C39A', category: 'IA & Productividad', color: '#15C39A' },
    { id: 'evernote', name: 'Evernote', icon: 'https://cdn.simpleicons.org/evernote/00A82D', category: 'IA & Productividad', color: '#00A82D' },
    { id: 'todoist', name: 'Todoist Pro', icon: 'https://cdn.simpleicons.org/todoist/E44332', category: 'IA & Productividad', color: '#E44332' },
    { id: 'slack', name: 'Slack', icon: 'https://cdn.simpleicons.org/slack/4A154B', category: 'IA & Productividad', color: '#4A154B' },
    { id: 'zoom', name: 'Zoom', icon: 'https://cdn.simpleicons.org/zoom/2D8CFF', category: 'IA & Productividad', color: '#2D8CFF' },
    { id: 'asana', name: 'Asana', icon: 'https://cdn.simpleicons.org/asana/F06A6A', category: 'IA & Productividad', color: '#F06A6A' },
    { id: 'trello', name: 'Trello', icon: 'https://cdn.simpleicons.org/trello/0052CC', category: 'IA & Productividad', color: '#0052CC' },
    { id: 'monday', name: 'Monday.com', icon: 'https://cdn.simpleicons.org/monday/FF3D57', category: 'IA & Productividad', color: '#FF3D57' },
    { id: 'clickup', name: 'ClickUp', icon: 'https://cdn.simpleicons.org/clickup/7B68EE', category: 'IA & Productividad', color: '#7B68EE' },
    { id: 'linear', name: 'Linear', icon: 'https://cdn.simpleicons.org/linear/5E6AD2', category: 'IA & Productividad', color: '#5E6AD2' },
    { id: 'obsidian', name: 'Obsidian Sync', icon: 'https://cdn.simpleicons.org/obsidian/7C3AED', category: 'IA & Productividad', color: '#7C3AED' },
    { id: 'perplexity', name: 'Perplexity Pro', icon: 'https://cdn.simpleicons.org/perplexity/1FB8CD', category: 'IA & Productividad', color: '#1FB8CD' },
    { id: 'midjourney', name: 'Midjourney', icon: 'https://cdn.simpleicons.org/midjourney/000000', category: 'IA & Productividad', color: '#000000' },
    { id: 'gemini', name: 'Gemini Advanced', icon: 'https://cdn.simpleicons.org/googlegemini/8E75B2', category: 'IA & Productividad', color: '#8E75B2' },

    // ═══════════════════════════════════════════════════════════════
    // CLOUD & STORAGE
    // ═══════════════════════════════════════════════════════════════
    { id: 'dropbox', name: 'Dropbox', icon: 'https://cdn.simpleicons.org/dropbox/0061FF', category: 'Cloud & Storage', color: '#0061FF' },
    { id: 'icloud', name: 'iCloud+', icon: 'https://cdn.simpleicons.org/icloud/3693F3', category: 'Cloud & Storage', color: '#3693F3' },
    { id: 'onedrive', name: 'OneDrive', icon: 'https://cdn.simpleicons.org/microsoftonedrive/0078D4', category: 'Cloud & Storage', color: '#0078D4' },
    { id: 'google-drive', name: 'Google Drive', icon: 'https://cdn.simpleicons.org/googledrive/4285F4', category: 'Cloud & Storage', color: '#4285F4' },
    { id: 'box', name: 'Box', icon: 'https://cdn.simpleicons.org/box/0061D5', category: 'Cloud & Storage', color: '#0061D5' },
    { id: 'mega', name: 'MEGA', icon: 'https://cdn.simpleicons.org/mega/D9272E', category: 'Cloud & Storage', color: '#D9272E' },

    // ═══════════════════════════════════════════════════════════════
    // NOTICIAS & LECTURA
    // ═══════════════════════════════════════════════════════════════
    { id: 'kindle-unlimited', name: 'Kindle Unlimited', icon: 'https://cdn.simpleicons.org/amazon/FF9900', category: 'Noticias & Lectura', color: '#FF9900' },
    { id: 'medium', name: 'Medium', icon: 'https://cdn.simpleicons.org/medium/000000', category: 'Noticias & Lectura', color: '#000000' },
    { id: 'scribd', name: 'Scribd', icon: 'https://cdn.simpleicons.org/scribd/1A7BBA', category: 'Noticias & Lectura', color: '#1A7BBA' },
    { id: 'nyt', name: 'New York Times', icon: 'https://cdn.simpleicons.org/nytimes/000000', category: 'Noticias & Lectura', color: '#000000' },
    { id: 'wsj', name: 'Wall Street Journal', icon: 'https://cdn.simpleicons.org/wsj/000000', category: 'Noticias & Lectura', color: '#000000' },
    { id: 'economist', name: 'The Economist', icon: 'https://cdn.simpleicons.org/theeconomist/E3120B', category: 'Noticias & Lectura', color: '#E3120B' },
    { id: 'blinkist', name: 'Blinkist', icon: 'https://cdn.simpleicons.org/blinkist/1BB978', category: 'Noticias & Lectura', color: '#1BB978' },
    { id: 'substack', name: 'Substack', icon: 'https://cdn.simpleicons.org/substack/FF6719', category: 'Noticias & Lectura', color: '#FF6719' },

    // ═══════════════════════════════════════════════════════════════
    // FITNESS & SALUD
    // ═══════════════════════════════════════════════════════════════
    { id: 'strava', name: 'Strava Premium', icon: 'https://cdn.simpleicons.org/strava/FC4C02', category: 'Fitness & Salud', color: '#FC4C02' },
    { id: 'peloton', name: 'Peloton', icon: 'https://cdn.simpleicons.org/peloton/000000', category: 'Fitness & Salud', color: '#000000' },
    { id: 'fitbit', name: 'Fitbit Premium', icon: 'https://cdn.simpleicons.org/fitbit/00B0B9', category: 'Fitness & Salud', color: '#00B0B9' },
    { id: 'apple-fitness', name: 'Apple Fitness+', icon: 'https://cdn.simpleicons.org/apple/000000', category: 'Fitness & Salud', color: '#000000' },
    { id: 'myfitnesspal', name: 'MyFitnessPal', icon: 'https://cdn.simpleicons.org/myfitnesspal/0077C8', category: 'Fitness & Salud', color: '#0077C8' },
    { id: 'headspace', name: 'Headspace', icon: 'https://cdn.simpleicons.org/headspace/F47D31', category: 'Fitness & Salud', color: '#F47D31' },
    { id: 'calm', name: 'Calm', icon: 'https://cdn.simpleicons.org/calm/4A90D9', category: 'Fitness & Salud', color: '#4A90D9' },
    { id: 'noom', name: 'Noom', icon: 'https://cdn.simpleicons.org/noom/EE571D', category: 'Fitness & Salud', color: '#EE571D' },

    // ═══════════════════════════════════════════════════════════════
    // EDUCACIÓN
    // ═══════════════════════════════════════════════════════════════
    { id: 'duolingo', name: 'Duolingo Plus', icon: 'https://cdn.simpleicons.org/duolingo/58CC02', category: 'Educación', color: '#58CC02' },
    { id: 'coursera', name: 'Coursera Plus', icon: 'https://cdn.simpleicons.org/coursera/0056D2', category: 'Educación', color: '#0056D2' },
    { id: 'udemy', name: 'Udemy', icon: 'https://cdn.simpleicons.org/udemy/A435F0', category: 'Educación', color: '#A435F0' },
    { id: 'skillshare', name: 'Skillshare', icon: 'https://cdn.simpleicons.org/skillshare/00FF84', category: 'Educación', color: '#00FF84' },
    { id: 'linkedin-learning', name: 'LinkedIn Learning', icon: 'https://cdn.simpleicons.org/linkedin/0A66C2', category: 'Educación', color: '#0A66C2' },
    { id: 'masterclass', name: 'MasterClass', icon: 'https://cdn.simpleicons.org/masterclass/000000', category: 'Educación', color: '#000000' },
    { id: 'brilliant', name: 'Brilliant', icon: 'https://cdn.simpleicons.org/brilliant/000000', category: 'Educación', color: '#000000' },
    { id: 'codecademy', name: 'Codecademy Pro', icon: 'https://cdn.simpleicons.org/codecademy/1F4056', category: 'Educación', color: '#1F4056' },
    { id: 'pluralsight', name: 'Pluralsight', icon: 'https://cdn.simpleicons.org/pluralsight/F15B2A', category: 'Educación', color: '#F15B2A' },
    { id: 'datacamp', name: 'DataCamp', icon: 'https://cdn.simpleicons.org/datacamp/03EF62', category: 'Educación', color: '#03EF62' },

    // ═══════════════════════════════════════════════════════════════
    // DISEÑO & CREATIVIDAD
    // ═══════════════════════════════════════════════════════════════
    { id: 'adobe-cc', name: 'Adobe Creative Cloud', icon: 'https://cdn.simpleicons.org/adobe/FF0000', category: 'Diseño & Creatividad', color: '#FF0000' },
    { id: 'canva', name: 'Canva Pro', icon: 'https://cdn.simpleicons.org/canva/00C4CC', category: 'Diseño & Creatividad', color: '#00C4CC' },
    { id: 'figma', name: 'Figma', icon: 'https://cdn.simpleicons.org/figma/F24E1E', category: 'Diseño & Creatividad', color: '#F24E1E' },
    { id: 'sketch', name: 'Sketch', icon: 'https://cdn.simpleicons.org/sketch/F7B500', category: 'Diseño & Creatividad', color: '#F7B500' },
    { id: 'invision', name: 'InVision', icon: 'https://cdn.simpleicons.org/invision/FF3366', category: 'Diseño & Creatividad', color: '#FF3366' },
    { id: 'procreate', name: 'Procreate', icon: 'https://cdn.simpleicons.org/procreate/000000', category: 'Diseño & Creatividad', color: '#000000' },

    // ═══════════════════════════════════════════════════════════════
    // COMUNICACIÓN
    // ═══════════════════════════════════════════════════════════════
    { id: 'whatsapp-business', name: 'WhatsApp Business', icon: 'https://cdn.simpleicons.org/whatsapp/25D366', category: 'Comunicación', color: '#25D366' },
    { id: 'telegram-premium', name: 'Telegram Premium', icon: 'https://cdn.simpleicons.org/telegram/26A5E4', category: 'Comunicación', color: '#26A5E4' },
    { id: 'mailchimp', name: 'Mailchimp', icon: 'https://cdn.simpleicons.org/mailchimp/FFE01B', category: 'Comunicación', color: '#FFE01B' },
    { id: 'hubspot', name: 'HubSpot', icon: 'https://cdn.simpleicons.org/hubspot/FF7A59', category: 'Comunicación', color: '#FF7A59' },

    // ═══════════════════════════════════════════════════════════════
    // FINANZAS
    // ═══════════════════════════════════════════════════════════════
    { id: 'tradingview', name: 'TradingView', icon: 'https://cdn.simpleicons.org/tradingview/131722', category: 'Finanzas', color: '#131722' },
    { id: 'quickbooks', name: 'QuickBooks', icon: 'https://cdn.simpleicons.org/quickbooks/2CA01C', category: 'Finanzas', color: '#2CA01C' },
    { id: 'ynab', name: 'YNAB', icon: 'https://cdn.simpleicons.org/ynab/85C3E9', category: 'Finanzas', color: '#85C3E9' },

    // ═══════════════════════════════════════════════════════════════
    // SEGURIDAD
    // ═══════════════════════════════════════════════════════════════
    { id: '1password', name: '1Password', icon: 'https://cdn.simpleicons.org/1password/0094F5', category: 'Seguridad', color: '#0094F5' },
    { id: 'lastpass', name: 'LastPass', icon: 'https://cdn.simpleicons.org/lastpass/D32D27', category: 'Seguridad', color: '#D32D27' },
    { id: 'bitwarden', name: 'Bitwarden', icon: 'https://cdn.simpleicons.org/bitwarden/175DDC', category: 'Seguridad', color: '#175DDC' },
    { id: 'dashlane', name: 'Dashlane', icon: 'https://cdn.simpleicons.org/dashlane/0E353D', category: 'Seguridad', color: '#0E353D' },
    { id: 'nordvpn', name: 'NordVPN', icon: 'https://cdn.simpleicons.org/nordvpn/4687FF', category: 'Seguridad', color: '#4687FF' },
    { id: 'expressvpn', name: 'ExpressVPN', icon: 'https://cdn.simpleicons.org/expressvpn/DA3940', category: 'Seguridad', color: '#DA3940' },
    { id: 'surfshark', name: 'Surfshark', icon: 'https://cdn.simpleicons.org/surfshark/178DEA', category: 'Seguridad', color: '#178DEA' },
    { id: 'protonvpn', name: 'ProtonVPN', icon: 'https://cdn.simpleicons.org/protonvpn/66DEB1', category: 'Seguridad', color: '#66DEB1' },

    // ═══════════════════════════════════════════════════════════════
    // OTROS
    // ═══════════════════════════════════════════════════════════════
    { id: 'patreon', name: 'Patreon', icon: 'https://cdn.simpleicons.org/patreon/FF424D', category: 'Otros', color: '#FF424D' },
    { id: 'ko-fi', name: 'Ko-fi', icon: 'https://cdn.simpleicons.org/kofi/FF5E5B', category: 'Otros', color: '#FF5E5B' },
    { id: 'buymeacoffee', name: 'Buy Me a Coffee', icon: 'https://cdn.simpleicons.org/buymeacoffee/FFDD00', category: 'Otros', color: '#FFDD00' },
    { id: 'uber-one', name: 'Uber One', icon: 'https://cdn.simpleicons.org/uber/000000', category: 'Otros', color: '#000000' },
    { id: 'rappi-prime', name: 'Rappi Prime', icon: 'https://cdn.simpleicons.org/rappi/FF441F', category: 'Otros', color: '#FF441F' },
];

// "Otro" option for custom subscriptions
export const OTHER_APP: SubscriptionApp = {
    id: 'other',
    name: 'Otro (Personalizado)',
    icon: '',
    category: 'Otros',
    color: '#6B7280'
};
