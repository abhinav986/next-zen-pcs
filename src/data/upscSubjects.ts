export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  totalTopics: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const upscSubjects: Subject[] = [
  {
    id: 'polity',
    name: 'Indian Polity & Governance',
    description: 'Constitution, governance systems, and political processes',
    icon: '⚖️',
    color: 'text-blue-600',
    totalTopics: 45,
    difficulty: 'Intermediate'
  },
  {
    id: 'history',
    name: 'History',
    description: 'Ancient, medieval, and modern Indian history',
    icon: '🏛️',
    color: 'text-amber-600',
    totalTopics: 52,
    difficulty: 'Intermediate'
  },
  {
    id: 'geography',
    name: 'Geography',
    description: 'Physical and human geography of India and world',
    icon: '🌍',
    color: 'text-green-600',
    totalTopics: 38,
    difficulty: 'Beginner'
  },
  {
    id: 'economics',
    name: 'Economics',
    description: 'Indian economy, planning, and economic development',
    icon: '📈',
    color: 'text-purple-600',
    totalTopics: 41,
    difficulty: 'Advanced'
  },
  {
    id: 'environment',
    name: 'Environment & Ecology',
    description: 'Environmental studies and biodiversity conservation',
    icon: '🌱',
    color: 'text-emerald-600',
    totalTopics: 29,
    difficulty: 'Intermediate'
  },
  {
    id: 'science',
    name: 'Science & Technology',
    description: 'Scientific developments and technological innovations',
    icon: '🔬',
    color: 'text-indigo-600',
    totalTopics: 35,
    difficulty: 'Intermediate'
  },
  {
    id: 'current-affairs',
    name: 'Current Affairs',
    description: 'Recent developments in national and international events',
    icon: '📰',
    color: 'text-red-600',
    totalTopics: 60,
    difficulty: 'Advanced'
  },
  {
    id: 'ethics',
    name: 'Ethics & Integrity',
    description: 'Ethics, integrity, and aptitude for civil services',
    icon: '🤝',
    color: 'text-orange-600',
    totalTopics: 25,
    difficulty: 'Intermediate'
  }
];

export const getSubjectById = (id: string): Subject | undefined => {
  return upscSubjects.find(subject => subject.id === id);
};