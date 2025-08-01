export const ALL_POSSIBLE_INTERESTS = [
    { name: 'Politics', emoji: '🗳️' }, { name: 'Sports', emoji: '⚽' },
    { name: 'Music', emoji: '🎵' }, { name: 'Gaming', emoji: '🎮' },
    { name: 'Science', emoji: '🧬' }, { name: 'Technology', emoji: '🤖' },
    { name: 'Movies & TV', emoji: '🎬' }, { name: 'Books & Writing', emoji: '📚' },
    { name: 'Health & Fitness', emoji: '🏋️' }, { name: 'Food & Cooking', emoji: '🍔' },
    { name: 'Travel & Adventure', emoji: '✈️' }, { name: 'Art & Design', emoji: '🎨' },
    { name: 'Fashion & Beauty', emoji: '👗' }, { name: 'Pets & Animals', emoji: '🐶' },
    { name: 'Business & Finance', emoji: '📈' }, { name: 'Lifestyle & Wellness', emoji: '🧘' }
];

// Single source of truth for all country data. Remains available for other features like your game.
export const ALL_COUNTRIES: { name: string; abbr: string; continent: string }[] = [
    // Africa
    { name: "Angola", abbr: "ao", continent: "Africa" }, { name: "Burkina Faso", abbr: "bf", continent: "Africa" },
    { name: "Burundi", abbr: "bi", continent: "Africa" }, { name: "Benin", abbr: "bj", continent: "Africa" },
    { name: "Botswana", abbr: "bw", continent: "Africa" }, { name: "DR Congo", abbr: "cd", continent: "Africa" },
    { name: "Central African Republic", abbr: "cf", continent: "Africa" }, { name: "Republic of the Congo", abbr: "cg", continent: "Africa" },
    { name: "Côte d'Ivoire (Ivory Coast)", abbr: "ci", continent: "Africa" }, { name: "Cameroon", abbr: "cm", continent: "Africa" },
    { name: "Cape Verde", abbr: "cv", continent: "Africa" }, { name: "Djibouti", abbr: "dj", continent: "Africa" },
    { name: "Algeria", abbr: "dz", continent: "Africa" }, { name: "Egypt", abbr: "eg", continent: "Africa" },
    { name: "Western Sahara", abbr: "eh", continent: "Africa" }, { name: "Eritrea", abbr: "er", continent: "Africa" },
    { name: "Ethiopia", abbr: "et", continent: "Africa" }, { name: "Gabon", abbr: "ga", continent: "Africa" },
    { name: "Ghana", abbr: "gh", continent: "Africa" }, { name: "Gambia", abbr: "gm", continent: "Africa" },
    { name: "Guinea", abbr: "gn", continent: "Africa" }, { name: "Equatorial Guinea", abbr: "gq", continent: "Africa" },
    { name: "Guinea-Bissau", abbr: "gw", continent: "Africa" }, { name: "Kenya", abbr: "ke", continent: "Africa" },
    { name: "Comoros", abbr: "km", continent: "Africa" }, { name: "Liberia", abbr: "lr", continent: "Africa" },
    { name: "Lesotho", abbr: "ls", continent: "Africa" }, { name: "Libya", abbr: "ly", continent: "Africa" },
    { name: "Morocco", abbr: "ma", continent: "Africa" }, { name: "Madagascar", abbr: "mg", continent: "Africa" },
    { name: "Mali", abbr: "ml", continent: "Africa" }, { name: "Mauritania", abbr: "mr", continent: "Africa" },
    { name: "Mauritius", abbr: "mu", continent: "Africa" }, { name: "Malawi", abbr: "mw", continent: "Africa" },
    { name: "Mozambique", abbr: "mz", continent: "Africa" }, { name: "Namibia", abbr: "na", continent: "Africa" },
    { name: "Niger", abbr: "ne", continent: "Africa" }, { name: "Nigeria", abbr: "ng", continent: "Africa" },
    { name: "Réunion", abbr: "re", continent: "Africa" }, { name: "Rwanda", abbr: "rw", continent: "Africa" },
    { name: "Seychelles", abbr: "sc", continent: "Africa" }, { name: "Sudan", abbr: "sd", continent: "Africa" },
    { name: "Saint Helena, Ascension and Tristan da Cunha", abbr: "sh", continent: "Africa" }, { name: "Sierra Leone", abbr: "sl", continent: "Africa" },
    { name: "Senegal", abbr: "sn", continent: "Africa" }, { name: "Somalia", abbr: "so", continent: "Africa" },
    { name: "South Sudan", abbr: "ss", continent: "Africa" }, { name: "São Tomé and Príncipe", abbr: "st", continent: "Africa" },
    { name: "Eswatini (Swaziland)", abbr: "sz", continent: "Africa" }, { name: "Chad", abbr: "td", continent: "Africa" },
    { name: "Togo", abbr: "tg", continent: "Africa" }, { name: "Tunisia", abbr: "tn", continent: "Africa" },
    { name: "Tanzania", abbr: "tz", continent: "Africa" }, { name: "Uganda", abbr: "ug", continent: "Africa" },
    { name: "Mayotte", abbr: "yt", continent: "Africa" }, { name: "South Africa", abbr: "za", continent: "Africa" },
    { name: "Zambia", abbr: "zm", continent: "Africa" }, { name: "Zimbabwe", abbr: "zw", continent: "Africa" },
    // Asia
    { name: "United Arab Emirates", abbr: "ae", continent: "Asia" }, { name: "Afghanistan", abbr: "af", continent: "Asia" },
    { name: "Armenia", abbr: "am", continent: "Asia" }, { name: "Azerbaijan", abbr: "az", continent: "Asia" },
    { name: "Bangladesh", abbr: "bd", continent: "Asia" }, { name: "Bahrain", abbr: "bh", continent: "Asia" },
    { name: "Brunei", abbr: "bn", continent: "Asia" }, { name: "Bhutan", abbr: "bt", continent: "Asia" },
    { name: "Cocos (Keeling) Islands", abbr: "cc", continent: "Asia" }, { name: "China", abbr: "cn", continent: "Asia" },
    { name: "Cyprus", abbr: "cy", continent: "Asia" }, { name: "Georgia", abbr: "ge", continent: "Asia" },
    { name: "Hong Kong", abbr: "hk", continent: "Asia" }, { name: "Indonesia", abbr: "id", continent: "Asia" },
    { name: "Israel", abbr: "il", continent: "Asia" }, { name: "India", abbr: "in", continent: "Asia" },
    { name: "British Indian Ocean Territory", abbr: "io", continent: "Asia" }, { name: "Iraq", abbr: "iq", continent: "Asia" },
    { name: "Iran", abbr: "ir", continent: "Asia" }, { name: "Jordan", abbr: "jo", continent: "Asia" },
    { name: "Japan", abbr: "jp", continent: "Asia" }, { name: "Kyrgyzstan", abbr: "kg", continent: "Asia" },
    { name: "Cambodia", abbr: "kh", continent: "Asia" }, { name: "North Korea", abbr: "kp", continent: "Asia" },
    { name: "South Korea", abbr: "kr", continent: "Asia" }, { name: "Kuwait", abbr: "kw", continent: "Asia" },
    { name: "Kazakhstan", abbr: "kz", continent: "Asia" }, { name: "Laos", abbr: "la", continent: "Asia" },
    { name: "Lebanon", abbr: "lb", continent: "Asia" }, { name: "Sri Lanka", abbr: "lk", continent: "Asia" },
    { name: "Myanmar", abbr: "mm", continent: "Asia" }, { name: "Mongolia", abbr: "mn", continent: "Asia" },
    { name: "Macau", abbr: "mo", continent: "Asia" }, { name: "Maldives", abbr: "mv", continent: "Asia" },
    { name: "Malaysia", abbr: "my", continent: "Asia" }, { name: "Nepal", abbr: "np", continent: "Asia" },
    { name: "Oman", abbr: "om", continent: "Asia" }, { name: "Philippines", abbr: "ph", continent: "Asia" },
    { name: "Pakistan", abbr: "pk", continent: "Asia" }, { name: "Palestine", abbr: "ps", continent: "Asia" },
    { name: "Qatar", abbr: "qa", continent: "Asia" }, { name: "Russia", abbr: "ru", continent: "Asia" },
    { name: "Saudi Arabia", abbr: "sa", continent: "Asia" }, { name: "Singapore", abbr: "sg", continent: "Asia" },
    { name: "Syria", abbr: "sy", continent: "Asia" }, { name: "Thailand", abbr: "th", continent: "Asia" },
    { name: "Tajikistan", abbr: "tj", continent: "Asia" }, { name: "Timor-Leste", abbr: "tl", continent: "Asia" },
    { name: "Turkmenistan", abbr: "tm", continent: "Asia" }, { name: "Turkey", abbr: "tr", continent: "Asia" },
    { name: "Taiwan", abbr: "tw", continent: "Asia" }, { name: "Uzbekistan", abbr: "uz", continent: "Asia" },
    { name: "Vietnam", abbr: "vn", continent: "Asia" }, { name: "Yemen", abbr: "ye", continent: "Asia" },
    // Europe
    { name: "Andorra", abbr: "ad", continent: "Europe" }, { name: "Albania", abbr: "al", continent: "Europe" },
    { name: "Austria", abbr: "at", continent: "Europe" }, { name: "Åland Islands", abbr: "ax", continent: "Europe" },
    { name: "Bosnia and Herzegovina", abbr: "ba", continent: "Europe" }, { name: "Belgium", abbr: "be", continent: "Europe" },
    { name: "Bulgaria", abbr: "bg", continent: "Europe" }, { name: "Belarus", abbr: "by", continent: "Europe" },
    { name: "Switzerland", abbr: "ch", continent: "Europe" }, { name: "Czechia", abbr: "cz", continent: "Europe" },
    { name: "Germany", abbr: "de", continent: "Europe" }, { name: "Denmark", abbr: "dk", continent: "Europe" },
    { name: "Estonia", abbr: "ee", continent: "Europe" }, { name: "Spain", abbr: "es", continent: "Europe" },
    { name: "Finland", abbr: "fi", continent: "Europe" }, { name: "Faroe Islands", abbr: "fo", continent: "Europe" },
    { name: "France", abbr: "fr", continent: "Europe" }, { name: "United Kingdom", abbr: "gb", continent: "Europe" },
    { name: "Guernsey", abbr: "gg", continent: "Europe" }, { name: "Gibraltar", abbr: "gi", continent: "Europe" },
    { name: "Greece", abbr: "gr", continent: "Europe" }, { name: "Croatia", abbr: "hr", continent: "Europe" },
    { name: "Hungary", abbr: "hu", continent: "Europe" }, { name: "Ireland", abbr: "ie", continent: "Europe" },
    { name: "Isle of Man", abbr: "im", continent: "Europe" }, { name: "Iceland", abbr: "is", continent: "Europe" },
    { name: "Italy", abbr: "it", continent: "Europe" }, { name: "Jersey", abbr: "je", continent: "Europe" },
    { name: "Liechtenstein", abbr: "li", continent: "Europe" }, { name: "Lithuania", abbr: "lt", continent: "Europe" },
    { name: "Luxembourg", abbr: "lu", continent: "Europe" }, { name: "Latvia", abbr: "lv", continent: "Europe" },
    { name: "Monaco", abbr: "mc", continent: "Europe" }, { name: "Moldova", abbr: "md", continent: "Europe" },
    { name: "Montenegro", abbr: "me", continent: "Europe" }, { name: "North Macedonia", abbr: "mk", continent: "Europe" },
    { name: "Malta", abbr: "mt", continent: "Europe" }, { name: "Netherlands", abbr: "nl", continent: "Europe" },
    { name: "Norway", abbr: "no", continent: "Europe" }, { name: "Poland", abbr: "pl", continent: "Europe" },
    { name: "Portugal", abbr: "pt", continent: "Europe" }, { name: "Romania", abbr: "ro", continent: "Europe" },
    { name: "Serbia", abbr: "rs", continent: "Europe" }, { name: "Sweden", abbr: "se", continent: "Europe" },
    { name: "Slovenia", abbr: "si", continent: "Europe" }, { name: "Svalbard and Jan Mayen", abbr: "sj", continent: "Europe" },
    { name: "Slovakia", abbr: "sk", continent: "Europe" }, { name: "San Marino", abbr: "sm", continent: "Europe" },
    { name: "Ukraine", abbr: "ua", continent: "Europe" }, { name: "Vatican City (Holy See)", abbr: "va", continent: "Europe" },
    { name: "Kosovo", abbr: "xk", continent: "Europe" },
    // North America
    { name: "Antigua and Barbuda", abbr: "ag", continent: "North America" }, { name: "Anguilla", abbr: "ai", continent: "North America" },
    { name: "Aruba", abbr: "aw", continent: "North America" }, { name: "Barbados", abbr: "bb", continent: "North America" },
    { name: "Saint Barthélemy", abbr: "bl", continent: "North America" }, { name: "Bermuda", abbr: "bm", continent: "North America" },
    { name: "Caribbean Netherlands", abbr: "bq", continent: "North America" }, { name: "Bahamas", abbr: "bs", continent: "North America" },
    { name: "Belize", abbr: "bz", continent: "North America" }, { name: "Canada", abbr: "ca", continent: "North America" },
    { name: "Costa Rica", abbr: "cr", continent: "North America" }, { name: "Cuba", abbr: "cu", continent: "North America" },
    { name: "Curaçao", abbr: "cw", continent: "North America" }, { name: "Dominica", abbr: "dm", continent: "North America" },
    { name: "Dominican Republic", abbr: "do", continent: "North America" }, { name: "Grenada", abbr: "gd", continent: "North America" },
    { name: "Greenland", abbr: "gl", continent: "North America" }, { name: "Guadeloupe", abbr: "gp", continent: "North America" },
    { name: "Guatemala", abbr: "gt", continent: "North America" }, { name: "Honduras", abbr: "hn", continent: "North America" },
    { name: "Haiti", abbr: "ht", continent: "North America" }, { name: "Jamaica", abbr: "jm", continent: "North America" },
    { name: "Saint Kitts and Nevis", abbr: "kn", continent: "North America" }, { name: "Cayman Islands", abbr: "ky", continent: "North America" },
    { name: "Saint Lucia", abbr: "lc", continent: "North America" }, { name: "Saint Martin", abbr: "mf", continent: "North America" },
    { name: "Martinique", abbr: "mq", continent: "North America" }, { name: "Montserrat", abbr: "ms", continent: "North America" },
    { name: "Mexico", abbr: "mx", continent: "North America" }, { name: "Nicaragua", abbr: "ni", continent: "North America" },
    { name: "Panama", abbr: "pa", continent: "North America" }, { name: "Saint Pierre and Miquelon", abbr: "pm", continent: "North America" },
    { name: "Puerto Rico", abbr: "pr", continent: "North America" }, { name: "El Salvador", abbr: "sv", continent: "North America" },
    { name: "Sint Maarten", abbr: "sx", continent: "North America" }, { name: "Turks and Caicos Islands", abbr: "tc", continent: "North America" },
    { name: "Trinidad and Tobago", abbr: "tt", continent: "North America" }, { name: "United States", abbr: "us", continent: "North America" },
    { name: "Saint Vincent and the Grenadines", abbr: "vc", continent: "North America" }, { name: "British Virgin Islands", abbr: "vg", continent: "North America" },
    { name: "United States Virgin Islands", abbr: "vi", continent: "North America" },
    // Oceania
    { name: "American Samoa", abbr: "as", continent: "Oceania" }, { name: "Australia", abbr: "au", continent: "Oceania" },
    { name: "Cook Islands", abbr: "ck", continent: "Oceania" }, { name: "Fiji", abbr: "fj", continent: "Oceania" },
    { name: "Micronesia", abbr: "fm", continent: "Oceania" }, { name: "Guam", abbr: "gu", continent: "Oceania" },
    { name: "Heard Island and McDonald Islands", abbr: "hm", continent: "Oceania" }, { name: "Kiribati", abbr: "ki", continent: "Oceania" },
    { name: "Marshall Islands", abbr: "mh", continent: "Oceania" }, { name: "Northern Mariana Islands", abbr: "mp", continent: "Oceania" },
    { name: "New Caledonia", abbr: "nc", continent: "Oceania" }, { name: "Norfolk Island", abbr: "nf", continent: "Oceania" },
    { name: "Nauru", abbr: "nr", continent: "Oceania" }, { name: "Niue", abbr: "nu", continent: "Oceania" },
    { name: "New Zealand", abbr: "nz", continent: "Oceania" }, { name: "French Polynesia", abbr: "pf", continent: "Oceania" },
    { name: "Papua New Guinea", abbr: "pg", continent: "Oceania" }, { name: "Pitcairn Islands", abbr: "pn", continent: "Oceania" },
    { name: "Palau", abbr: "pw", continent: "Oceania" }, { name: "Solomon Islands", abbr: "sb", continent: "Oceania" },
    { name: "Tokelau", abbr: "tk", continent: "Oceania" }, { name: "Tonga", abbr: "to", continent: "Oceania" },
    { name: "Tuvalu", abbr: "tv", continent: "Oceania" }, { name: "United States Minor Outlying Islands", abbr: "um", continent: "Oceania" },
    { name: "Vanuatu", abbr: "vu", continent: "Oceania" }, { name: "Wallis and Futuna", abbr: "wf", continent: "Oceania" },
    { name: "Samoa", abbr: "ws", continent: "Oceania" },
    // South America
    { name: "Argentina", abbr: "ar", continent: "South America" }, { name: "Bolivia", abbr: "bo", continent: "South America" },
    { name: "Brazil", abbr: "br", continent: "South America" }, { name: "Chile", abbr: "cl", continent: "South America" },
    { name: "Colombia", abbr: "co", continent: "South America" }, { name: "Ecuador", abbr: "ec", continent: "South America" },
    { name: "Falkland Islands", abbr: "fk", continent: "South America" }, { name: "French Guiana", abbr: "gf", continent: "South America" },
    { name: "South Georgia", abbr: "gs", continent: "South America" }, { name: "Guyana", abbr: "gy", continent: "South America" },
    { name: "Peru", abbr: "pe", continent: "South America" }, { name: "Paraguay", abbr: "py", continent: "South America" },
    { name: "Suriname", abbr: "sr", continent: "South America" }, { name: "Uruguay", abbr: "uy", continent: "South America" },
    { name: "Venezuela", abbr: "ve", continent: "South America" },
    // Antarctica
    { name: "Antarctica", abbr: "aq", continent: "Antarctica" }, { name: "Bouvet Island", abbr: "bv", continent: "Antarctica" },
    { name: "French Southern and Antarctic Lands", abbr: "tf", continent: "Antarctica" }
];

// List of popular country names from the user's image.
const POPULAR_COUNTRY_NAMES: string[] = [
    "Albania", "Argentina", "Armenia", "Australia", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Canada", "Chile", "China", "Colombia", "Croatia", "Czechia", "Denmark", "Finland", "France", "Germany", "Greece", "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan", "Kazakhstan", "South Korea", "Latvia", "Lithuania", "Luxembourg", "Malaysia", "Mexico", "Moldova", "Netherlands", "New Zealand", "North Macedonia", "Norway", "Peru", "Philippines", "Poland", "Portugal", "Romania", "Russia", "Serbia", "Slovakia", "Slovenia", "South Africa", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "Ukraine", "United Kingdom", "United States", "Venezuela"
];

// Create a Set of popular country names for efficient lookup.
const popularCountryNamesSet = new Set(POPULAR_COUNTRY_NAMES);

// Filter the main list to get only the popular countries.
const popularCountries = ALL_COUNTRIES.filter(country => popularCountryNamesSet.has(country.name));

// Export the popular countries grouped by continent for the settings modal.
export const POPULAR_COUNTRIES_BY_CONTINENT = popularCountries.reduce((acc, country) => {
    const { continent } = country;
    if (!acc[continent]) {
        acc[continent] = [];
    }
    acc[continent].push(country);
    return acc;
}, {} as { [key: string]: { name: string; abbr: string; continent: string }[] });
