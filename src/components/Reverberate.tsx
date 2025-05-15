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
    tooltip: 'Detects statements expressing strong opposition to Israeli policies or existence'
  },
  {
    id: 'criminal',
    label: 'Criminal',
    keywords: ['Arrest', 'Convicted', 'Prison', 'Jail', 'Crime'],
    tooltip: 'Finds references to criminal activities, arrests, or legal troubles'
  },
  {
    id: 'far-left',
    label: 'Far Left',
    keywords: ['Communist', 'Marxist', 'Socialist', 'Revolution', 'Radical'],
    tooltip: 'Identifies associations with extreme left-wing ideologies or movements'
  },
  {
    id: 'far-right',
    label: 'Far Right',
    keywords: ['Nationalist', 'Fascist', 'Nazi', 'White supremacy', 'Alt-right'],
    tooltip: 'Detects connections to extreme right-wing ideologies or groups'
  },
  {
    id: 'sexual',
    label: 'Sexual',
    keywords: ['Harassment', 'Assault', 'Abuse', 'Misconduct', 'Inappropriate'],
    tooltip: 'Identifies reports of sexual misconduct or inappropriate behavior'
  }
];