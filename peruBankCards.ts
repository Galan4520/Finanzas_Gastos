// Base de datos de tarjetas de bancos peruanos con imágenes
export interface BankCard {
    id: string;
    banco: string;
    nombre: string;
    tipo: 'Crédito' | 'Débito';
    imagen: string;
    color: string;
    gradient: string;
}

// Imágenes de referencia de tarjetas peruanas
export const PERUVIAN_BANK_CARDS: BankCard[] = [
    // BCP - Banco de Crédito del Perú
    {
        id: 'bcp-visa-signature',
        banco: 'BCP',
        nombre: 'Visa Signature',
        tipo: 'Crédito',
        imagen: 'https://ww3.viabcp.com/connect/recursos/images/tarjetas/visa-signature.png',
        color: '#002a8d',
        gradient: 'from-[#002a8d] to-[#0050ef]'
    },
    {
        id: 'bcp-visa-platinum',
        banco: 'BCP',
        nombre: 'Visa Platinum',
        tipo: 'Crédito',
        imagen: 'https://ww3.viabcp.com/connect/recursos/images/tarjetas/visa-platinum.png',
        color: '#1a1a2e',
        gradient: 'from-[#1a1a2e] to-[#4a4a6a]'
    },
    {
        id: 'bcp-visa-oro',
        banco: 'BCP',
        nombre: 'Visa Oro',
        tipo: 'Crédito',
        imagen: 'https://ww3.viabcp.com/connect/recursos/images/tarjetas/visa-oro.png',
        color: '#b8860b',
        gradient: 'from-[#b8860b] to-[#daa520]'
    },
    {
        id: 'bcp-visa-clasica',
        banco: 'BCP',
        nombre: 'Visa Clásica',
        tipo: 'Crédito',
        imagen: 'https://ww3.viabcp.com/connect/recursos/images/tarjetas/visa-clasica.png',
        color: '#002a8d',
        gradient: 'from-[#002a8d] to-[#0050ef]'
    },
    {
        id: 'bcp-latam-pass',
        banco: 'BCP',
        nombre: 'Visa Latam Pass',
        tipo: 'Crédito',
        imagen: 'https://ww3.viabcp.com/connect/recursos/images/tarjetas/latam-pass.png',
        color: '#e31837',
        gradient: 'from-[#e31837] to-[#ff6b6b]'
    },
    {
        id: 'bcp-debito',
        banco: 'BCP',
        nombre: 'Débito BCP',
        tipo: 'Débito',
        imagen: 'https://ww3.viabcp.com/connect/recursos/images/tarjetas/debito.png',
        color: '#002a8d',
        gradient: 'from-[#002a8d] to-[#0050ef]'
    },

    // Interbank
    {
        id: 'interbank-visa-signature',
        banco: 'Interbank',
        nombre: 'Visa Signature',
        tipo: 'Crédito',
        imagen: 'https://interbank.pe/documents/20182/5765043/visa-signature.png',
        color: '#009b3a',
        gradient: 'from-[#009b3a] to-[#00c652]'
    },
    {
        id: 'interbank-visa-platinum',
        banco: 'Interbank',
        nombre: 'Visa Platinum',
        tipo: 'Crédito',
        imagen: 'https://interbank.pe/documents/20182/5765043/visa-platinum.png',
        color: '#1a1a2e',
        gradient: 'from-[#009b3a] to-[#00c652]'
    },
    {
        id: 'interbank-visa-oro',
        banco: 'Interbank',
        nombre: 'Visa Oro',
        tipo: 'Crédito',
        imagen: 'https://interbank.pe/documents/20182/5765043/visa-oro.png',
        color: '#b8860b',
        gradient: 'from-[#009b3a] to-[#00c652]'
    },
    {
        id: 'interbank-visa-clasica',
        banco: 'Interbank',
        nombre: 'Visa Clásica',
        tipo: 'Crédito',
        imagen: 'https://interbank.pe/documents/20182/5765043/visa-clasica.png',
        color: '#009b3a',
        gradient: 'from-[#009b3a] to-[#00c652]'
    },
    {
        id: 'interbank-debito',
        banco: 'Interbank',
        nombre: 'Débito Interbank',
        tipo: 'Débito',
        imagen: 'https://interbank.pe/documents/20182/5765043/debito.png',
        color: '#009b3a',
        gradient: 'from-[#009b3a] to-[#00c652]'
    },

    // BBVA
    {
        id: 'bbva-visa-signature',
        banco: 'BBVA',
        nombre: 'Visa Signature',
        tipo: 'Crédito',
        imagen: 'https://www.bbva.pe/content/dam/public-web/peru/images/tarjetas/signature.png',
        color: '#004481',
        gradient: 'from-[#004481] to-[#1464a5]'
    },
    {
        id: 'bbva-visa-platinum',
        banco: 'BBVA',
        nombre: 'Visa Platinum',
        tipo: 'Crédito',
        imagen: 'https://www.bbva.pe/content/dam/public-web/peru/images/tarjetas/platinum.png',
        color: '#004481',
        gradient: 'from-[#004481] to-[#1464a5]'
    },
    {
        id: 'bbva-visa-oro',
        banco: 'BBVA',
        nombre: 'Visa Oro',
        tipo: 'Crédito',
        imagen: 'https://www.bbva.pe/content/dam/public-web/peru/images/tarjetas/oro.png',
        color: '#b8860b',
        gradient: 'from-[#004481] to-[#1464a5]'
    },
    {
        id: 'bbva-debito',
        banco: 'BBVA',
        nombre: 'Débito BBVA',
        tipo: 'Débito',
        imagen: 'https://www.bbva.pe/content/dam/public-web/peru/images/tarjetas/debito.png',
        color: '#004481',
        gradient: 'from-[#004481] to-[#1464a5]'
    },

    // Scotiabank
    {
        id: 'scotiabank-visa-signature',
        banco: 'Scotiabank',
        nombre: 'Visa Signature',
        tipo: 'Crédito',
        imagen: 'https://www.scotiabank.com.pe/Imagenes/tarjetas/visa-signature.png',
        color: '#ec111a',
        gradient: 'from-[#ec111a] to-[#ff4d55]'
    },
    {
        id: 'scotiabank-visa-platinum',
        banco: 'Scotiabank',
        nombre: 'Visa Platinum',
        tipo: 'Crédito',
        imagen: 'https://www.scotiabank.com.pe/Imagenes/tarjetas/visa-platinum.png',
        color: '#ec111a',
        gradient: 'from-[#ec111a] to-[#ff4d55]'
    },
    {
        id: 'scotiabank-debito',
        banco: 'Scotiabank',
        nombre: 'Débito Scotiabank',
        tipo: 'Débito',
        imagen: 'https://www.scotiabank.com.pe/Imagenes/tarjetas/debito.png',
        color: '#ec111a',
        gradient: 'from-[#ec111a] to-[#ff4d55]'
    },

    // Banco Pichincha
    {
        id: 'pichincha-visa-clasica',
        banco: 'Banco Pichincha',
        nombre: 'Visa Clásica',
        tipo: 'Crédito',
        imagen: 'https://www.pichincha.pe/imagenes/tarjetas/visa-clasica.png',
        color: '#ffdd00',
        gradient: 'from-[#ffdd00] to-[#ffea61]'
    },
    {
        id: 'pichincha-debito',
        banco: 'Banco Pichincha',
        nombre: 'Débito Pichincha',
        tipo: 'Débito',
        imagen: 'https://www.pichincha.pe/imagenes/tarjetas/debito.png',
        color: '#ffdd00',
        gradient: 'from-[#ffdd00] to-[#ffea61]'
    },

    // Falabella (CMR)
    {
        id: 'falabella-cmr-visa',
        banco: 'Falabella',
        nombre: 'CMR Visa',
        tipo: 'Crédito',
        imagen: 'https://www.bancofalabella.pe/imagenes/tarjetas/cmr-visa.png',
        color: '#1a9f4b',
        gradient: 'from-[#1a9f4b] to-[#a3cd39]'
    },
    {
        id: 'falabella-cmr-mastercard',
        banco: 'Falabella',
        nombre: 'CMR Mastercard',
        tipo: 'Crédito',
        imagen: 'https://www.bancofalabella.pe/imagenes/tarjetas/cmr-mastercard.png',
        color: '#1a9f4b',
        gradient: 'from-[#1a9f4b] to-[#a3cd39]'
    },

    // Ripley
    {
        id: 'ripley-mastercard',
        banco: 'Ripley',
        nombre: 'Ripley Mastercard',
        tipo: 'Crédito',
        imagen: 'https://www.bancoripley.com.pe/imagenes/tarjetas/ripley-mastercard.png',
        color: '#883696',
        gradient: 'from-[#883696] to-[#b35cad]'
    },
    {
        id: 'ripley-visa',
        banco: 'Ripley',
        nombre: 'Ripley Visa',
        tipo: 'Crédito',
        imagen: 'https://www.bancoripley.com.pe/imagenes/tarjetas/ripley-visa.png',
        color: '#883696',
        gradient: 'from-[#883696] to-[#b35cad]'
    }
];

// Obtener tarjetas por banco
export const getCardsByBank = (banco: string): BankCard[] => {
    return PERUVIAN_BANK_CARDS.filter(card => card.banco === banco);
};

// Obtener tarjetas por tipo
export const getCardsByType = (tipo: 'Crédito' | 'Débito'): BankCard[] => {
    return PERUVIAN_BANK_CARDS.filter(card => card.tipo === tipo);
};

// Obtener tarjetas por banco y tipo
export const getCardsByBankAndType = (banco: string, tipo: 'Crédito' | 'Débito'): BankCard[] => {
    return PERUVIAN_BANK_CARDS.filter(card => card.banco === banco && card.tipo === tipo);
};

// Obtener gradiente por banco
export const getGradientByBank = (banco: string): string => {
    switch (banco) {
        case 'BCP': return 'from-[#002a8d] to-[#0050ef]';
        case 'Interbank': return 'from-[#009b3a] to-[#00c652]';
        case 'BBVA': return 'from-[#004481] to-[#1464a5]';
        case 'Scotiabank': return 'from-[#ec111a] to-[#ff4d55]';
        case 'Banco Pichincha': return 'from-[#ffdd00] to-[#ffea61]';
        case 'Falabella': return 'from-[#1a9f4b] to-[#a3cd39]';
        case 'Ripley': return 'from-[#883696] to-[#b35cad]';
        default: return 'from-slate-700 to-slate-600';
    }
};

// Lista de bancos únicos
export const BANCOS_PERU = [...new Set(PERUVIAN_BANK_CARDS.map(card => card.banco))];

// Tipos de tarjeta
export const TIPOS_TARJETA = ['Crédito', 'Débito'] as const;
