import { postOfficeAssets } from './postOffice';
import { keeperRooms } from './keeperRooms';

// Replace scenery and props here without changing chapter state or controls.
export const journeyScenes = {
  ...keeperRooms,
  administrators: { frame: `${import.meta.env.BASE_URL}assets/ui-reference/paper-ornament.jpg` },
  stamp: { background: `${import.meta.env.BASE_URL}assets/writing-desk/desk-empty.png` },
  post: { background: `${import.meta.env.BASE_URL}assets/administrators/post-office-facade.png` },
  waiting: { background: postOfficeAssets.interior },
};
