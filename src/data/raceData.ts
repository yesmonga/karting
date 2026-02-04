// DNF KART TEAM Race Data - 4H Endurance Lyon

export interface LapData {
  lap: number;
  s1: number;
  s2: number;
  s3: number;
  total: number;
}

export interface StintConfig {
  stint: number;
  driver: string;
  code: string;
  startLap: number;
  endLap: number;
  note?: string;
}

export interface Driver {
  name: string;
  fullName: string;
  code: string;
  color: string;
}

export interface RaceInfo {
  trackName: string;
  raceType: string;
  kartNumber: number;
  teamName: string;
}

export interface CurrentStatus {
  position: number;
  totalKarts: number;
  currentLap: number;
  totalLaps: number;
  elapsedTime: string;
  remainingTime: string;
}

// Complete lap data from the race
export const lapData: LapData[] = [
  { lap: 207, s1: 24496, s2: 21189, s3: 22792, total: 68477 },
  { lap: 206, s1: 24489, s2: 20206, s3: 23246, total: 67941 },
  { lap: 205, s1: 24671, s2: 20374, s3: 23492, total: 68537 },
  { lap: 204, s1: 24444, s2: 20425, s3: 25001, total: 69870 },
  { lap: 203, s1: 24755, s2: 20480, s3: 22525, total: 67760 },
  { lap: 202, s1: 24035, s2: 20077, s3: 22412, total: 66524 },
  { lap: 201, s1: 24070, s2: 20110, s3: 22524, total: 66704 },
  { lap: 200, s1: 24192, s2: 19952, s3: 22806, total: 66950 },
  { lap: 199, s1: 24363, s2: 20840, s3: 22536, total: 67739 },
  { lap: 198, s1: 24450, s2: 20700, s3: 22692, total: 67842 },
  { lap: 197, s1: 24619, s2: 20259, s3: 24120, total: 68998 },
  { lap: 196, s1: 25028, s2: 21117, s3: 23034, total: 69179 },
  { lap: 195, s1: 24029, s2: 20612, s3: 23743, total: 68384 },
  { lap: 194, s1: 24393, s2: 20799, s3: 22476, total: 67668 },
  { lap: 193, s1: 24538, s2: 20511, s3: 22399, total: 67448 },
  { lap: 192, s1: 24538, s2: 19918, s3: 22420, total: 66876 },
  { lap: 191, s1: 24002, s2: 20052, s3: 22925, total: 66979 },
  { lap: 190, s1: 23861, s2: 20473, s3: 22585, total: 66919 },
  { lap: 189, s1: 24046, s2: 19935, s3: 22472, total: 66453 },
  { lap: 188, s1: 23994, s2: 19968, s3: 22605, total: 66567 },
  { lap: 187, s1: 23908, s2: 20008, s3: 22647, total: 66563 },
  { lap: 186, s1: 23991, s2: 19852, s3: 22509, total: 66352 },
  { lap: 185, s1: 24087, s2: 20071, s3: 22496, total: 66654 },
  { lap: 184, s1: 24012, s2: 20237, s3: 22746, total: 66995 },
  { lap: 183, s1: 24177, s2: 20026, s3: 22301, total: 66504 },
  { lap: 182, s1: 24081, s2: 19965, s3: 22585, total: 66631 },
  { lap: 181, s1: 24062, s2: 20005, s3: 22453, total: 66520 },
  { lap: 180, s1: 24002, s2: 20038, s3: 22781, total: 66821 },
  { lap: 179, s1: 24196, s2: 20100, s3: 22478, total: 66774 },
  { lap: 178, s1: 24346, s2: 21456, s3: 23024, total: 68826 },
  { lap: 177, s1: 24085, s2: 20013, s3: 22653, total: 66751 },
  { lap: 176, s1: 24351, s2: 20487, s3: 22783, total: 67621 },
  { lap: 174, s1: 24504, s2: 20327, s3: 22572, total: 67403 },
  { lap: 173, s1: 24295, s2: 20313, s3: 25078, total: 69686 },
  { lap: 172, s1: 24252, s2: 20211, s3: 23598, total: 68061 },
  { lap: 171, s1: 24589, s2: 20494, s3: 23036, total: 68119 },
  { lap: 170, s1: 24577, s2: 20378, s3: 22853, total: 67808 },
  { lap: 169, s1: 24176, s2: 20445, s3: 23290, total: 67911 },
  { lap: 168, s1: 24478, s2: 20089, s3: 22615, total: 67182 },
  { lap: 167, s1: 24229, s2: 20099, s3: 22775, total: 67103 },
  { lap: 166, s1: 24461, s2: 20319, s3: 22624, total: 67404 },
  { lap: 165, s1: 24512, s2: 20158, s3: 22678, total: 67348 },
  { lap: 164, s1: 24344, s2: 20118, s3: 22616, total: 67078 },
  { lap: 163, s1: 24846, s2: 20159, s3: 23118, total: 68123 },
  { lap: 162, s1: 24568, s2: 20219, s3: 23071, total: 67858 },
  { lap: 161, s1: 25203, s2: 20111, s3: 23410, total: 68724 },
  { lap: 160, s1: 24384, s2: 20335, s3: 22768, total: 67487 },
  { lap: 159, s1: 24167, s2: 20200, s3: 22964, total: 67331 },
  { lap: 158, s1: 25205, s2: 20616, s3: 23313, total: 69134 },
  { lap: 157, s1: 24250, s2: 20058, s3: 23320, total: 67628 },
  { lap: 156, s1: 24395, s2: 20445, s3: 22735, total: 67575 },
  { lap: 155, s1: 24671, s2: 20063, s3: 23082, total: 67816 },
  { lap: 154, s1: 24290, s2: 20269, s3: 22610, total: 67169 },
  { lap: 153, s1: 24856, s2: 20258, s3: 22767, total: 67881 },
  { lap: 152, s1: 25037, s2: 20367, s3: 22818, total: 68222 },
  { lap: 150, s1: 24699, s2: 20963, s3: 24941, total: 70603 },
  { lap: 149, s1: 24443, s2: 20666, s3: 22804, total: 67913 },
  { lap: 148, s1: 24153, s2: 20021, s3: 22652, total: 66826 },
  { lap: 147, s1: 24167, s2: 20524, s3: 22418, total: 67109 },
  { lap: 146, s1: 24175, s2: 20005, s3: 22613, total: 66793 },
  { lap: 145, s1: 24258, s2: 19955, s3: 22550, total: 66763 },
  { lap: 144, s1: 24624, s2: 19962, s3: 23418, total: 68004 },
  { lap: 143, s1: 24073, s2: 19891, s3: 22509, total: 66473 },
  { lap: 142, s1: 24230, s2: 19972, s3: 22406, total: 66608 },
  { lap: 141, s1: 24440, s2: 20631, s3: 22800, total: 67871 },
  { lap: 140, s1: 24159, s2: 20045, s3: 22333, total: 66537 },
  { lap: 139, s1: 24288, s2: 20157, s3: 22685, total: 67130 },
  { lap: 138, s1: 23995, s2: 20101, s3: 22768, total: 66864 },
  { lap: 137, s1: 24450, s2: 20772, s3: 22641, total: 67863 },
  { lap: 136, s1: 23950, s2: 20066, s3: 22485, total: 66501 },
  { lap: 135, s1: 24285, s2: 19992, s3: 22490, total: 66767 },
  { lap: 134, s1: 24241, s2: 20452, s3: 22552, total: 67245 },
  { lap: 133, s1: 24277, s2: 20257, s3: 22470, total: 67004 },
  { lap: 132, s1: 23982, s2: 20071, s3: 22720, total: 66773 },
  { lap: 131, s1: 24150, s2: 20370, s3: 22766, total: 67286 },
  { lap: 130, s1: 24236, s2: 20103, s3: 23004, total: 67343 },
  { lap: 129, s1: 24345, s2: 20159, s3: 22554, total: 67058 },
  { lap: 128, s1: 24499, s2: 20136, s3: 23295, total: 67930 },
  { lap: 127, s1: 24252, s2: 20126, s3: 22558, total: 66936 },
  { lap: 125, s1: 24346, s2: 20300, s3: 22715, total: 67361 },
  { lap: 124, s1: 24451, s2: 20859, s3: 22743, total: 68053 },
  { lap: 123, s1: 24449, s2: 20299, s3: 23042, total: 67790 },
  { lap: 122, s1: 24072, s2: 20444, s3: 22556, total: 67072 },
  { lap: 121, s1: 24253, s2: 19928, s3: 22628, total: 66809 },
  { lap: 120, s1: 24063, s2: 19954, s3: 22636, total: 66653 },
  { lap: 119, s1: 24268, s2: 19999, s3: 22811, total: 67078 },
  { lap: 118, s1: 23989, s2: 19941, s3: 22734, total: 66664 },
  { lap: 117, s1: 24082, s2: 20011, s3: 22502, total: 66595 },
  { lap: 116, s1: 24152, s2: 19974, s3: 22529, total: 66655 },
  { lap: 115, s1: 24048, s2: 20059, s3: 22522, total: 66629 },
  { lap: 114, s1: 24312, s2: 20080, s3: 22491, total: 66883 },
  { lap: 113, s1: 24260, s2: 20008, s3: 22591, total: 66859 },
  { lap: 112, s1: 24296, s2: 20085, s3: 22842, total: 67223 },
  { lap: 111, s1: 24624, s2: 19998, s3: 22481, total: 67103 },
  { lap: 110, s1: 25243, s2: 19971, s3: 22601, total: 67815 },
  { lap: 108, s1: 24037, s2: 19833, s3: 22540, total: 66410 },
  { lap: 107, s1: 23999, s2: 20477, s3: 22704, total: 67180 },
  { lap: 106, s1: 23964, s2: 20822, s3: 23399, total: 68185 },
  { lap: 105, s1: 24563, s2: 19937, s3: 22458, total: 66958 },
  { lap: 104, s1: 24584, s2: 19927, s3: 22509, total: 67020 },
  { lap: 103, s1: 24146, s2: 20072, s3: 22671, total: 66889 },
  { lap: 102, s1: 24442, s2: 20048, s3: 22506, total: 66996 },
  { lap: 101, s1: 23761, s2: 19959, s3: 22753, total: 66473 },
  { lap: 100, s1: 24449, s2: 20008, s3: 22504, total: 66961 },
  { lap: 99, s1: 24736, s2: 20038, s3: 22520, total: 67294 },
  { lap: 98, s1: 23871, s2: 19954, s3: 23419, total: 67244 },
  { lap: 97, s1: 24072, s2: 19928, s3: 22499, total: 66499 },
  { lap: 96, s1: 24000, s2: 20097, s3: 23296, total: 67393 },
  { lap: 95, s1: 24122, s2: 20197, s3: 22457, total: 66776 },
  { lap: 94, s1: 24510, s2: 20614, s3: 22771, total: 67895 },
  { lap: 93, s1: 24148, s2: 20140, s3: 22328, total: 66616 },
  { lap: 92, s1: 24093, s2: 20484, s3: 22564, total: 67141 },
  { lap: 91, s1: 24119, s2: 20077, s3: 22316, total: 66512 },
  { lap: 89, s1: 24110, s2: 20316, s3: 23187, total: 67613 },
  { lap: 88, s1: 24152, s2: 20308, s3: 22617, total: 67077 },
  { lap: 87, s1: 24188, s2: 20184, s3: 22569, total: 66941 },
  { lap: 86, s1: 24297, s2: 20949, s3: 22358, total: 67604 },
  { lap: 85, s1: 24328, s2: 20957, s3: 22608, total: 67893 },
  { lap: 84, s1: 24548, s2: 20972, s3: 22698, total: 68218 },
  { lap: 83, s1: 24430, s2: 20497, s3: 23238, total: 68165 },
  { lap: 82, s1: 24347, s2: 20188, s3: 22668, total: 67203 },
  { lap: 81, s1: 24984, s2: 20683, s3: 23303, total: 68970 },
  { lap: 80, s1: 24134, s2: 20263, s3: 22569, total: 66966 },
  { lap: 79, s1: 24182, s2: 20128, s3: 23264, total: 67574 },
  { lap: 78, s1: 24350, s2: 20169, s3: 22685, total: 67204 },
  { lap: 77, s1: 24251, s2: 20026, s3: 22992, total: 67269 },
  { lap: 76, s1: 24239, s2: 20284, s3: 22845, total: 67368 },
  { lap: 75, s1: 24285, s2: 20320, s3: 22820, total: 67425 },
  { lap: 74, s1: 24328, s2: 20199, s3: 23405, total: 67932 },
  { lap: 73, s1: 24164, s2: 20135, s3: 22761, total: 67060 },
  { lap: 72, s1: 24346, s2: 20257, s3: 22780, total: 67383 },
  { lap: 71, s1: 24159, s2: 20181, s3: 22634, total: 66974 },
  { lap: 70, s1: 24161, s2: 20319, s3: 23492, total: 67972 },
  { lap: 69, s1: 24931, s2: 20181, s3: 22709, total: 67821 },
  { lap: 68, s1: 24727, s2: 20509, s3: 22644, total: 67880 },
  { lap: 67, s1: 24161, s2: 20146, s3: 22661, total: 66968 },
  { lap: 66, s1: 24371, s2: 20287, s3: 22652, total: 67310 },
  { lap: 65, s1: 24483, s2: 20325, s3: 22939, total: 67747 },
  { lap: 64, s1: 24451, s2: 20771, s3: 22950, total: 68172 },
  { lap: 62, s1: 24210, s2: 20067, s3: 22535, total: 66812 },
  { lap: 61, s1: 24242, s2: 20237, s3: 22693, total: 67172 },
  { lap: 60, s1: 25638, s2: 20453, s3: 22715, total: 68806 },
  { lap: 59, s1: 24300, s2: 20071, s3: 23553, total: 67924 },
  { lap: 58, s1: 24398, s2: 20144, s3: 22475, total: 67017 },
  { lap: 57, s1: 24264, s2: 20077, s3: 23246, total: 67587 },
  { lap: 56, s1: 24308, s2: 20025, s3: 23701, total: 68034 },
  { lap: 55, s1: 24413, s2: 19960, s3: 22871, total: 67244 },
  { lap: 54, s1: 24089, s2: 20073, s3: 22773, total: 66935 },
  { lap: 53, s1: 24148, s2: 20044, s3: 22542, total: 66734 },
  { lap: 52, s1: 23999, s2: 20080, s3: 22640, total: 66719 },
  { lap: 51, s1: 24046, s2: 19964, s3: 22552, total: 66562 },
  { lap: 50, s1: 24310, s2: 19936, s3: 22478, total: 66724 },
  { lap: 49, s1: 24244, s2: 20177, s3: 22624, total: 67045 },
  { lap: 48, s1: 24271, s2: 20049, s3: 23461, total: 67781 },
  { lap: 47, s1: 24183, s2: 20118, s3: 22561, total: 66862 },
  { lap: 46, s1: 24315, s2: 20099, s3: 22566, total: 66980 },
  { lap: 45, s1: 24074, s2: 19973, s3: 22748, total: 66795 },
  { lap: 44, s1: 24259, s2: 20120, s3: 22798, total: 67177 },
  { lap: 43, s1: 24699, s2: 20021, s3: 22705, total: 67425 },
  { lap: 42, s1: 24073, s2: 20138, s3: 22888, total: 67099 },
  { lap: 41, s1: 24258, s2: 20375, s3: 22717, total: 67350 },
  { lap: 40, s1: 24249, s2: 20001, s3: 22641, total: 66891 },
  { lap: 39, s1: 24531, s2: 20253, s3: 22636, total: 67420 },
  { lap: 38, s1: 23991, s2: 20626, s3: 22776, total: 67393 },
  { lap: 37, s1: 24216, s2: 20098, s3: 22805, total: 67119 },
  { lap: 36, s1: 24849, s2: 20421, s3: 22957, total: 68227 },
  { lap: 35, s1: 24973, s2: 20099, s3: 23850, total: 68922 },
  { lap: 34, s1: 24751, s2: 20336, s3: 23622, total: 68709 },
  { lap: 33, s1: 24459, s2: 20310, s3: 23435, total: 68204 },
  { lap: 31, s1: 24395, s2: 20261, s3: 24197, total: 68853 },
  { lap: 30, s1: 24011, s2: 20098, s3: 22412, total: 66521 },
  { lap: 29, s1: 24164, s2: 20168, s3: 22536, total: 66868 },
  { lap: 27, s1: 25191, s2: 20464, s3: 23094, total: 68749 },
  { lap: 26, s1: 24787, s2: 20840, s3: 23573, total: 69200 },
  { lap: 25, s1: 24238, s2: 20112, s3: 22529, total: 66879 },
  { lap: 24, s1: 23804, s2: 20312, s3: 22903, total: 67019 },
  { lap: 23, s1: 24051, s2: 20082, s3: 22443, total: 66576 },
  { lap: 22, s1: 24356, s2: 20115, s3: 22394, total: 66865 },
  { lap: 21, s1: 24326, s2: 20574, s3: 23199, total: 68099 },
  { lap: 20, s1: 24003, s2: 20050, s3: 22426, total: 66479 },
  { lap: 19, s1: 24201, s2: 20012, s3: 23356, total: 67569 },
  { lap: 18, s1: 24109, s2: 20489, s3: 22433, total: 67031 },
  { lap: 17, s1: 24120, s2: 20023, s3: 22893, total: 67036 },
  { lap: 16, s1: 24063, s2: 20143, s3: 22591, total: 66797 },
  { lap: 15, s1: 24221, s2: 19961, s3: 22662, total: 66844 },
  { lap: 14, s1: 24226, s2: 20130, s3: 22285, total: 66641 },
  { lap: 13, s1: 23939, s2: 19992, s3: 22401, total: 66332 },
  { lap: 12, s1: 24092, s2: 20008, s3: 22435, total: 66535 },
  { lap: 11, s1: 24144, s2: 19993, s3: 23149, total: 67286 },
  { lap: 10, s1: 24156, s2: 19869, s3: 22570, total: 66595 },
  { lap: 9, s1: 24523, s2: 20773, s3: 22988, total: 68284 },
  { lap: 8, s1: 24276, s2: 20196, s3: 22636, total: 67108 },
  { lap: 7, s1: 24048, s2: 20663, s3: 23740, total: 68451 },
  { lap: 6, s1: 23976, s2: 19862, s3: 22471, total: 66309 },
  { lap: 5, s1: 25543, s2: 21045, s3: 22641, total: 69229 },
  { lap: 4, s1: 24002, s2: 20181, s3: 22553, total: 66736 },
  { lap: 3, s1: 24223, s2: 20636, s3: 22474, total: 67333 },
];

// Stint configuration
export const stintConfig: StintConfig[] = [
  { stint: 1, driver: 'EVAN', code: 'A', startLap: 3, endLap: 31, note: 'Stint 1' },
  { stint: 2, driver: 'EVAN', code: 'A', startLap: 33, endLap: 62, note: 'Stint 2' },
  { stint: 3, driver: 'ENZO', code: 'B', startLap: 64, endLap: 89, note: 'Stint 3' },
  { stint: 4, driver: 'IDRISS', code: 'C', startLap: 91, endLap: 125, note: 'Stint 4' },
  { stint: 5, driver: 'ALEX', code: 'D', startLap: 127, endLap: 150, note: 'Stint 5' },
  { stint: 6, driver: 'ENZO', code: 'B', startLap: 152, endLap: 174, note: 'Stint 6' },
  { stint: 7, driver: 'IDRISS', code: 'C', startLap: 176, endLap: 207, note: 'Stint 7 (finish)' },
];

// Drivers configuration
export const drivers: Record<string, Driver> = {
  EVAN: { name: 'EVAN', fullName: 'FAURE EVAN', code: 'A', color: '#EF4444' },
  ENZO: { name: 'ENZO', fullName: 'FRANGER-RITEAU ENZO', code: 'B', color: '#3B82F6' },
  IDRISS: { name: 'IDRISS', fullName: 'ESSAGHIR IDRISS', code: 'C', color: '#10B981' },
  ALEX: { name: 'ALEX', fullName: 'FAURE ALEX', code: 'D', color: '#F59E0B' },
};

// Race info
export const raceInfo: RaceInfo = {
  trackName: 'Circuit de Lyon',
  raceType: '4H Endurance',
  kartNumber: 25,
  teamName: 'DNF KART TEAM',
};

// Current race status (simulated final state)
export const currentStatus: CurrentStatus = {
  position: 8,
  totalKarts: 42,
  currentLap: 207,
  totalLaps: 207,
  elapsedTime: '04:00:00',
  remainingTime: '00:00:00',
};
