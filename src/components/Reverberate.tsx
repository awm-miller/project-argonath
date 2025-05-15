const categories: Category[] = [
  {
    id: 'antisemite',
    label: 'Antisemite',
    keywords: ['Jews', 'Zionists', 'Zios', 'Jewish', 'Holocaust'],
    tooltip: 'Identifies content expressing prejudice or hostility against Jewish people'
  },
  {
    id: 'anti-israel',
    label: 'Anti-Israel',
    keywords: ['Hamas', 'Bibi', 'Netanyahu', 'Genocide', 'Gaza'],
    tooltip: 'Detects extreme or hostile positions regarding the State of Israel'
  },
  {
    id: 'criminal',
    label: 'Criminal',
    keywords: ['Arrest', 'Convicted', 'Prison', 'Jail', 'Crime'],
    tooltip: 'Finds references to criminal activities or legal troubles'
  },
  {
    id: 'far-left',
    label: 'Far Left',
    keywords: ['Communist', 'Marxist', 'Socialist', 'Revolution', 'Radical'],
    tooltip: 'Identifies associations with extreme left-wing ideologies'
  },
  {
    id: 'far-right',
    label: 'Far Right',
    keywords: ['Nationalist', 'Fascist', 'Nazi', 'White supremacy', 'Alt-right'],
    tooltip: 'Detects connections to extreme right-wing movements'
  },
  {
    id: 'sexual',
    label: 'Sexual',
    keywords: ['Harassment', 'Assault', 'Abuse', 'Misconduct', 'Inappropriate'],
    tooltip: 'Identifies references to sexual misconduct or inappropriate behavior'
  }
];

export default categories