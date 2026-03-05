export type Mood = 'Happy' | 'Neutral' | 'Tired' | 'Sad';

export interface Memory {
    id: string;
    date: string;
    title: string;
    description: string;
    curhatan: string; // Handwritten note
    imageUrl: string;
}

export const MOCK_MEMORIES: Memory[] = [
    {
        id: '1',
        date: 'February 14, 2024',
        title: 'Our First Sunset',
        description: 'Watching the sky turn pink and orange together.',
        curhatan: 'I remember how cold your hands were, but my heart was so warm. ❤️',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000',
    },
    {
        id: '2',
        date: 'June 20, 2024',
        title: 'Coffee Shop Date',
        description: 'We talked for hours and forgot completely about the time.',
        curhatan: 'You laughed so hard you spilled your latte. Cutest thing ever. ☕',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1000',
    },
    {
        id: '3',
        date: 'October 10, 2024',
        title: 'Lost in the City',
        description: 'Walking around without a destination.',
        curhatan: 'As long as Im with you, Im never really lost. 🌆',
        imageUrl: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=1000',
    },
    {
        id: '4',
        date: 'December 31, 2024',
        title: 'New Year s Eve',
        description: 'Starting a brand new year with my favorite person.',
        curhatan: 'Here is to a million more moments like this. ✨',
        imageUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&q=80&w=1000',
    }
];

export interface Song {
    id: string;
    title: string;
    artist: string;
    duration: string;
    memoryText: string;
    audioUrl?: string;
}

export const MOCK_PLAYLIST: Song[] = [
    {
        id: '1',
        title: 'Soft',
        artist: 'LANY',
        duration: '3:13',
        memoryText: '"This song the definition of u hehehe"',
        audioUrl: '/audio/LANY - Soft.mp3'
    },
    {
        id: '2',
        title: 'kota ini tak sama tanpamu',
        artist: 'Nadhif Basalamah',
        duration: '4:23',
        memoryText: '"Ini juga sering kamu puter hehehe"',
        audioUrl: '/audio/Nadhif Basalamah, Aziz Harun, Aisha Retno - kota ini tak sama tanpamu (with Aziz Harun Aisha Retno).mp3'
    },
    {
        id: '3',
        title: 'Biar jadi urusanku',
        artist: 'Sal Priadi',
        duration: '4:38',
        memoryText: '"Ini lagu yang aku pertama saranin ke kamu terus diputer mulu hehehe"',
        audioUrl: '/audio/Sal Priadi - Biar jadi urusanku.mp3'
    },
];

export interface BucketItem {
    id: string;
    title: string;
    isCompleted: boolean;
}

export const MOCK_BUCKETLIST: BucketItem[] = [
    { id: '1', title: 'Watch Coldplay concert together', isCompleted: false },
    { id: '2', title: 'Road trip across the island', isCompleted: false },
    { id: '3', title: 'Cook a failed viral recipe together in the kitchen', isCompleted: true },
    { id: '4', title: 'Watch the sunrise from the mountain top', isCompleted: false },
    { id: '5', title: 'Adopt a cute puppy', isCompleted: false },
];
