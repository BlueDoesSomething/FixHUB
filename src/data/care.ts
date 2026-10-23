export type CareDifficulty = 'Easy' | 'Moderate';

export interface CareStep {
  title: string;
  detail: string;
}

export interface CareIssue {
  id: string;
  title: string;
  category: string;
  icon: string;
  summary: string;
  estimatedTime: string;
  difficulty: CareDifficulty;
  successRate: number;
  symptoms: string[];
  safety?: string;
  steps: CareStep[];
}

const icon = (paths: string) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const careCategories: string[] = [
  'All',
  'Battery & Power',
  'Screen & Display',
  'Performance',
  'Connectivity',
  'Audio & Mic',
  'Camera',
  'Physical Damage',
];

export const careIssues: CareIssue[] = [
  {
    id: 'battery-drain',
    title: 'Battery Drains Too Fast',
    category: 'Battery & Power',
    icon: icon('<rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="11" x2="6" y2="13"/>'),
    summary: 'Extend your battery life and find out if the cell has already worn out.',
    estimatedTime: '4–6 min',
    difficulty: 'Easy',
    successRate: 72,
    symptoms: ['Battery drops quickly even on standby', 'Phone gets warm during normal use', 'Charges slowly or drains while plugged in'],
    steps: [
      { title: 'Check battery health', detail: 'Open Settings → Battery → Battery Health. A maximum capacity below 80% means the battery has aged and may need replacement.' },
      { title: 'Find the biggest consumers', detail: 'In Settings → Battery, review app usage. Force-stop or uninstall apps that constantly run in the background.' },
      { title: 'Lower screen brightness & timeout', detail: 'Reduce brightness, enable auto-brightness, and set the screen timeout to 30 seconds.' },
      { title: 'Turn off unused radios', detail: 'Disable Wi-Fi, Bluetooth, GPS and hotspot when not in use, and switch on battery saver / low power mode.' },
      { title: 'Update and reboot', detail: 'Install pending system updates, then restart your phone to clear stuck background processes.' },
    ],
  },
  {
    id: 'wont-charge',
    title: "Phone Won't Charge",
    category: 'Battery & Power',
    icon: icon('<path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19"/><line x1="23" y1="13" x2="23" y2="11"/><polyline points="11 6 7 12 13 12 9 18"/>'),
    summary: 'Clean and test the charging path before replacing the port.',
    estimatedTime: '3–5 min',
    difficulty: 'Easy',
    successRate: 65,
    symptoms: ['No charging icon when plugged in', 'Charges only at a certain cable angle', 'Battery percentage not increasing'],
    safety: 'Never use a frayed, cut or wet cable, and disconnect immediately if it gets hot.',
    steps: [
      { title: 'Try a different cable & adapter', detail: 'Swap cables and try another wall adapter. Most charging failures are caused by a damaged cable, not the phone.' },
      { title: 'Clean the charging port', detail: 'Power off, then gently remove lint or dust from the port with a dry wooden toothpick or soft brush. Never use metal.' },
      { title: 'Test another outlet', detail: 'Plug into a different outlet or a USB port on a computer to rule out a dead socket.' },
      { title: 'Force restart', detail: 'Hold the power button (with volume down on most Android phones) for 10–15 seconds, then plug in again.' },
      { title: 'Check for liquid or damage', detail: 'Inspect the port for corrosion or debris. If it is bent or wet, stop and book a repair.' },
    ],
  },
  {
    id: 'overheating',
    title: 'Device Overheating',
    category: 'Battery & Power',
    icon: icon('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    summary: 'Cool your phone down and stop the heat at its source.',
    estimatedTime: '3–4 min',
    difficulty: 'Easy',
    successRate: 78,
    symptoms: ['Phone is hot to the touch', 'Warm even while idle or charging', 'A temperature warning appears'],
    steps: [
      { title: 'Remove the case', detail: 'Take off thick or non-breathable cases so heat can escape while the phone cools.' },
      { title: 'Stop heavy tasks', detail: 'Close games, navigation, tethering and video apps that push the processor and graphics.' },
      { title: 'Unplug & cool down', detail: 'Stop charging and move the phone to a shaded, ventilated spot. Never put it in a fridge or freezer.' },
      { title: 'Check your charging gear', detail: 'Use only the certified charger for your model — cheap adapters overheat the battery.' },
      { title: 'Update & scan for rogue apps', detail: 'Install system updates and uninstall suspicious apps that run constantly in the background.' },
    ],
  },
  {
    id: 'frozen-screen',
    title: 'Frozen or Unresponsive Screen',
    category: 'Screen & Display',
    icon: icon('<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'),
    summary: 'Get a stuck screen responding again without losing your data.',
    estimatedTime: '2–3 min',
    difficulty: 'Easy',
    successRate: 85,
    symptoms: ['Touch is not responding', 'Screen stuck on one image', 'Hardware buttons do nothing'],
    steps: [
      { title: 'Force restart', detail: 'Hold the power button (with volume down on most Android phones) for 10–15 seconds until the logo appears.' },
      { title: 'Wait for the system', detail: 'Give the phone 1–2 minutes after reboot — background updates can make it seem frozen.' },
      { title: 'Boot in safe mode (Android)', detail: 'If it freezes again, boot in safe mode to check whether a third-party app is the cause.' },
      { title: 'Free up storage', detail: 'A nearly full storage can freeze the phone. Delete files to free at least 1 GB, then restart.' },
      { title: 'Update software', detail: 'Install pending system updates, which often fix stability bugs.' },
    ],
  },
  {
    id: 'screen-damage',
    title: 'Cracked or Damaged Screen',
    category: 'Screen & Display',
    icon: icon('<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="7" y1="6" x2="17" y2="16"/><line x1="13" y1="4" x2="8" y2="12"/>'),
    summary: 'Protect your data and device while you arrange a screen fix.',
    estimatedTime: '1 min',
    difficulty: 'Moderate',
    successRate: 10,
    symptoms: ['Visible cracks or chips', 'Dead or discolored spots', 'Touch works on only part of the screen'],
    safety: 'Do not press on a cracked screen — broken glass can cut you and damage the display further.',
    steps: [
      { title: 'Back up your data', detail: 'Connect to a computer or cloud and back up photos, contacts and chats while the screen still responds.' },
      { title: 'Protect the surface', detail: 'Apply tape over the cracks to stop glass from spreading and cutting your fingers.' },
      { title: 'Note what still works', detail: 'Check whether touch, display and the front camera still work so the technician knows what to expect.' },
      { title: 'Book a screen replacement', detail: 'A cracked panel cannot be fixed by software. Continue to book a repair for same-day screen replacement.' },
    ],
  },
  {
    id: 'slow-performance',
    title: 'Slow Performance or Lag',
    category: 'Performance',
    icon: icon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
    summary: 'Speed up a phone that stutters, lags or takes long to open apps.',
    estimatedTime: '5–8 min',
    difficulty: 'Easy',
    successRate: 70,
    symptoms: ['Apps take long to open', 'Typing and scrolling stutter', 'Lag right after unlocking'],
    steps: [
      { title: 'Restart the phone', detail: 'A simple reboot clears memory leaks and background junk — always try this first.' },
      { title: 'Free up storage', detail: 'Keep at least 10% of storage free. Delete unused apps, videos and cached files.' },
      { title: 'Reduce animations', detail: 'Turn on battery saver, or reduce animation scale in developer options.' },
      { title: 'Update apps & system', detail: 'Install app and OS updates — outdated versions are a common cause of lag.' },
      { title: 'Factory reset (last resort)', detail: 'Back up, then reset to factory settings if lag persists. If it is still slow, the storage or battery may be failing.' },
    ],
  },
  {
    id: 'storage-full',
    title: 'Storage Almost Full',
    category: 'Performance',
    icon: icon('<path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="21 3 21 9 15 9"/>'),
    summary: 'Reclaim space so apps, photos and updates work again.',
    estimatedTime: '4–6 min',
    difficulty: 'Easy',
    successRate: 80,
    symptoms: ['“Storage full” warning', 'Cannot install or update apps', 'Camera will not save photos'],
    steps: [
      { title: 'Find the space hogs', detail: 'In Settings → Storage, sort by size and review apps, photos and videos.' },
      { title: 'Offload photos & videos', detail: 'Back up media to Google Photos, iCloud or a computer, then delete the local copies.' },
      { title: 'Clear app caches', detail: 'Clear the cache for social and streaming apps — they can hold several gigabytes.' },
      { title: 'Remove unused apps', detail: 'Uninstall apps you no longer use and delete their leftover data.' },
      { title: 'Turn on automatic cleanup', detail: 'Enable Storage Sense (Android) or Offload Unused Apps (iPhone) to keep space free automatically.' },
    ],
  },
  {
    id: 'no-wifi',
    title: 'No Wi-Fi or Internet Connection',
    category: 'Connectivity',
    icon: icon('<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>'),
    summary: 'Get back online by clearing the most common network glitches.',
    estimatedTime: '3–5 min',
    difficulty: 'Easy',
    successRate: 75,
    symptoms: ['Wi-Fi will not connect', 'Connected but no internet', 'Pages and apps will not load'],
    steps: [
      { title: 'Toggle airplane mode', detail: 'Turn airplane mode on for 10 seconds, then off, to refresh the phone’s radio.' },
      { title: 'Forget & reconnect', detail: 'Forget the network, then reconnect and re-enter the password.' },
      { title: 'Restart the router', detail: 'Unplug the router for 30 seconds. Check other devices — if they are also offline, the issue is the network.' },
      { title: 'Reset network settings', detail: 'Reset network settings to clear glitches (note: this removes saved Wi-Fi passwords).' },
      { title: 'Check data & app settings', detail: 'Confirm mobile data is on and that the app is allowed to use data in its settings.' },
    ],
  },
  {
    id: 'bluetooth-issue',
    title: "Bluetooth Won't Connect",
    category: 'Connectivity',
    icon: icon('<polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>'),
    summary: 'Re-pair headphones, speakers and other Bluetooth devices.',
    estimatedTime: '2–4 min',
    difficulty: 'Easy',
    successRate: 80,
    symptoms: ['Device not found when pairing', 'Pairs but keeps disconnecting', 'Audio cuts in and out'],
    steps: [
      { title: 'Toggle Bluetooth', detail: 'Turn Bluetooth off and on, then try pairing again.' },
      { title: 'Put the device in pairing mode', detail: 'Hold the button on your earbuds or speaker until the light flashes, then re-pair.' },
      { title: 'Forget the old pairing', detail: 'Remove the device from your phone’s Bluetooth list and pair it fresh.' },
      { title: 'Clear interference', detail: 'Move away from microwaves, routers and other 2.4 GHz devices.' },
      { title: 'Reset network settings', detail: 'Resetting network settings also clears Bluetooth pairings and can fix stubborn connections.' },
    ],
  },
  {
    id: 'no-sound',
    title: 'No Sound from Speaker',
    category: 'Audio & Mic',
    icon: icon('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><line x1="18" y1="6" x2="18" y2="18"/>'),
    summary: 'Bring back sound from your phone’s built-in speaker.',
    estimatedTime: '2–3 min',
    difficulty: 'Easy',
    successRate: 68,
    symptoms: ['No sound in calls or media', 'Sound only from one speaker', 'Speaker sounds muffled'],
    steps: [
      { title: 'Check volume & mute', detail: 'Raise the media volume and make sure silent / vibrate mode is off.' },
      { title: 'Confirm the audio route', detail: 'Disconnect Bluetooth headphones — audio may still be routed to them.' },
      { title: 'Clean the speaker', detail: 'Power off, then gently brush the speaker grille with a soft, dry brush to remove dust.' },
      { title: 'Test with another app', detail: 'Play music and a video, and try a headset, to isolate whether the speaker or a single app is at fault.' },
      { title: 'Restart the phone', detail: 'Reboot to clear audio-driver glitches.' },
    ],
  },
  {
    id: 'mic-issue',
    title: 'Microphone Not Working',
    category: 'Audio & Mic',
    icon: icon('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>'),
    summary: 'Fix callers not hearing you or silent voice recordings.',
    estimatedTime: '2–4 min',
    difficulty: 'Easy',
    successRate: 60,
    symptoms: ['Callers cannot hear you', 'Voice notes come out silent', 'The assistant does not respond'],
    steps: [
      { title: 'Remove obstructions', detail: 'Peel off screen protectors or cases that cover the microphone holes.' },
      { title: 'Clean the mic port', detail: 'Gently brush the bottom and top microphone openings to clear dust and lint.' },
      { title: 'Check app permissions', detail: 'Allow microphone access for the app in Settings → Apps → Permissions.' },
      { title: 'Test both microphones', detail: 'Record a voice memo and make a speakerphone call to see which mic fails.' },
      { title: 'Disconnect accessories', detail: 'Unplug wired headsets and disable Bluetooth, which can take over the microphone.' },
    ],
  },
  {
    id: 'camera-issue',
    title: 'Camera Not Working or Blurry',
    category: 'Camera',
    icon: icon('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
    summary: 'Restore clear photos and a working camera app.',
    estimatedTime: '3–5 min',
    difficulty: 'Easy',
    successRate: 55,
    symptoms: ['“Cannot connect to camera”', 'Photos come out blurry', 'Black screen in the camera app'],
    steps: [
      { title: 'Clean the lens', detail: 'Wipe the lens with a soft microfibre cloth — fingerprints cause blurry photos.' },
      { title: 'Close other camera apps', detail: 'Force-stop apps that may hold the camera open, then reopen the camera.' },
      { title: 'Clear the camera app cache', detail: 'In Settings → Apps → Camera, clear cache and data.' },
      { title: 'Restart the phone', detail: 'Reboot to release the camera module and its drivers.' },
      { title: 'Check storage', detail: 'A full storage can stop the camera from saving photos; free up space and retry.' },
    ],
  },
  {
    id: 'water-damage',
    title: 'Liquid or Water Damage',
    category: 'Physical Damage',
    icon: icon('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'),
    summary: 'Act fast and safely after a spill — the first hour matters most.',
    estimatedTime: '1 min',
    difficulty: 'Moderate',
    successRate: 20,
    symptoms: ['Phone fell in water', 'Fog or droplets under the screen', 'Phone will not turn on after getting wet'],
    safety: 'Never charge a wet phone and do not heat it with a hair dryer or oven — this causes more damage.',
    steps: [
      { title: 'Power off immediately', detail: 'Do not press buttons or charge. If it is on, hold power to shut it down safely.' },
      { title: 'Remove case, SIM & card tray', detail: 'Take out the case and open the SIM / memory tray so air can circulate.' },
      { title: 'Wipe and air-dry', detail: 'Blot gently with a cloth and let it air-dry in a ventilated spot for at least 48 hours.' },
      { title: 'Do not charge or heat', detail: 'Avoid rice, hair dryers and chargers. Charging a wet phone can short-circuit the board.' },
      { title: 'Book a professional diagnosis', detail: 'Liquid damage needs ultrasonic cleaning and board inspection. Book a repair as soon as possible.' },
    ],
  },
];

export function getCareIssue(id: string): CareIssue | undefined {
  return careIssues.find((issue) => issue.id === id);
}

export const careStats = [
  { value: '8,400+', label: 'Issues self-fixed' },
  { value: '6 min', label: 'Average fix time' },
  { value: '₱1,200', label: 'Avg. cost saved' },
];
