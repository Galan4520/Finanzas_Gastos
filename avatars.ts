// Avatar definitions for profile selection
export interface Avatar {
    id: string;
    label: string;
    description: string;
    emoji: string;
    gradient: string;
    // Legacy field kept for backward compat — no longer used for rendering
    imagePath: string;
}

export const avatars: Avatar[] = [
    {
        id: 'empresaria',
        label: 'Empresaria',
        description: 'Enfocada en los negocios',
        emoji: '👩‍💼',
        gradient: 'from-violet-500 to-purple-600',
        imagePath: ''
    },
    {
        id: 'tech',
        label: 'Tech',
        description: 'Apasionado por la tecnologia',
        emoji: '👨‍💻',
        gradient: 'from-blue-500 to-indigo-600',
        imagePath: ''
    },
    {
        id: 'estudiante',
        label: 'Estudiante',
        description: 'Enfocada en el aprendizaje',
        emoji: '👩‍🎓',
        gradient: 'from-emerald-500 to-teal-600',
        imagePath: ''
    },
    {
        id: 'zen',
        label: 'Zen',
        description: 'Equilibrio y bienestar',
        emoji: '🧘‍♀️',
        gradient: 'from-pink-500 to-rose-600',
        imagePath: ''
    },
    {
        id: 'fitness',
        label: 'Fitness',
        description: 'Vida saludable y ejercicio',
        emoji: '💪',
        gradient: 'from-orange-500 to-red-600',
        imagePath: ''
    },
    {
        id: 'viajero',
        label: 'Viajero',
        description: 'Amante de los viajes y la aventura',
        emoji: '🌍',
        gradient: 'from-cyan-500 to-blue-600',
        imagePath: ''
    },
    {
        id: 'creativa',
        label: 'Creativa',
        description: 'Arte y diseno',
        emoji: '🎨',
        gradient: 'from-amber-500 to-orange-600',
        imagePath: ''
    },
    {
        id: 'salud',
        label: 'Salud',
        description: 'Cuidado y bienestar',
        emoji: '👩‍⚕️',
        gradient: 'from-teal-500 to-green-600',
        imagePath: ''
    },
    {
        id: 'gamer',
        label: 'Gamer',
        description: 'Apasionado de los videojuegos',
        emoji: '🎮',
        gradient: 'from-indigo-500 to-violet-600',
        imagePath: ''
    },
    {
        id: 'ejecutivo',
        label: 'Ejecutivo',
        description: 'Profesional y organizado',
        emoji: '👔',
        gradient: 'from-slate-500 to-gray-700',
        imagePath: ''
    }
];

export const getAvatarById = (id: string): Avatar | undefined => {
    return avatars.find(a => a.id === id);
};
