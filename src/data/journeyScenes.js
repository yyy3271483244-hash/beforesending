import { postOfficeAssets } from './postOffice';
import { keeperRooms } from './keeperRooms';

// Replace scenery and props here without changing chapter state or controls.
export const journeyScenes = {
  ...keeperRooms,
  administrators: { frame: '/assets/ui-reference/paper-ornament.jpg' },
  stamp: { background: '/assets/writing-desk/desk-empty.png' },
  post: { background: '/assets/administrators/post-office-facade.png' },
  waiting: { background: postOfficeAssets.interior },
};
