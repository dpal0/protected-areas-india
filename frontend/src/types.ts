export interface ParkProperties {
  SITE_ID: number;
  NAME_ENG: string;
  NAME: string;
  DESIG_ENG: string;
  DESIG_TYPE: string;
  IUCN_CAT: string;
  INT_CRIT: string;
  REALM: string;
  REP_AREA: number;
  GIS_AREA: number;
  STATUS: string;
  STATUS_YR: number;
  GOV_TYPE: string;
  PRNT_ISO3: string;
  VERIF: string;
  MANG_AUTH: string;
}

export interface Park {
  id: number;
  properties: ParkProperties;
  centroid: [number, number];
}
