export const initials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('');

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const BLOOD_TYPES = [
  'O(I) Rh+','O(I) Rh−','A(II) Rh+','A(II) Rh−',
  'B(III) Rh+','B(III) Rh−','AB(IV) Rh+','AB(IV) Rh−',
];

export const STATUS_LABELS = {
  active:    { label: 'Активный',   cls: 'badge-blue'  },
  critical:  { label: 'Критический',cls: 'badge-red'   },
  discharged:{ label: 'Выписан',    cls: 'badge-green' },
};

export const ROLES = {
  admin: 'Администратор',
  nurse: 'Медсестра',
  doctor:'Врач',
};

export const today = () => new Date().toLocaleDateString('ru-RU');