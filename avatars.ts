// Avatar definitions for profile selection
export interface Avatar {
    id: string;
    label: string;
    description: string;
    imagePath: string;
}

export const avatars: Avatar[] = [
    {
        id: 'viajero',
        label: 'Viajero',
        description: 'Amante de los viajes y la aventura',
        imagePath: '/avatars/viajero.jpg'
    },
    {
        id: 'gamer',
        label: 'Gamer',
        description: 'Apasionado de los videojuegos',
        imagePath: '/avatars/gamer.jpg'
    },
    {
        id: 'estudiante',
        label: 'Estudiante',
        description: 'Enfocado en el aprendizaje',
        imagePath: '/avatars/estudiante.jpg'
    },
    {
        id: 'fitness',
        label: 'Fitness',
        description: 'Vida saludable y ejercicio',
        imagePath: '/avatars/fitness.jpg'
    },
    {
        id: 'empresario',
        label: 'Empresario',
        description: 'Enfocado en los negocios',
        imagePath: '/avatars/empresario.jpg'
    }
];

export const getAvatarById = (id: string): Avatar | undefined => {
    return avatars.find(a => a.id === id);
};
