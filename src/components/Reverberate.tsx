const categories: Category[] = [
  {
    id: 'antisemite',
    label: 'Antisemite',
    keywords: ['Jews', 'Zionists', 'Zios', 'Jewish', 'Holocaust'],
    tooltip: 'Identifies content expressing antisemitic views or promoting antisemitic conspiracy theories'
  },
  {
    id: 'anti-israel',
    label: 'Anti-Israel',
    keywords: ['Hamas', 'Bibi', 'Netanyahu', 'Genocide', 'Gaza'],
    tooltip: 'Detects extreme anti-Israel rhetoric and potential support for terrorist organizations'
  },
  {
    id: 'criminal',
    label: 'Criminal',
    keywords: ['Arrest', 'Convicted', 'Prison', 'Jail', 'Crime'],
    tooltip: 'Finds records of criminal activity, arrests, or convictions'
  },
  {
    id: 'far-left',
    label: 'Far Left',
    keywords: ['Communist', 'Marxist', 'Socialist', 'Revolution', 'Radical'],
    tooltip: 'Identifies associations with extreme left-wing ideologies and organizations'
  },
  {
    id: 'far-right',
    label: 'Far Right',
    keywords: ['Nationalist', 'Fascist', 'Nazi', 'White supremacy', 'Alt-right'],
    tooltip: 'Detects connections to far-right extremism and white nationalist movements'
  },
  {
    id: 'sexual',
    label: 'Sexual',
    keywords: ['Harassment', 'Assault', 'Abuse', 'Misconduct', 'Inappropriate'],
    tooltip: 'Identifies records of sexual misconduct, harassment, or abuse allegations'
  }
];

export default categories