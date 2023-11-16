//Array of regions to filter data from postamat api
////////////////////////////////////////////////////////////////////////
const regions = [
  "karakalpakstan",
  "tashkent city",
  "tashkent region",
  "andijan region",
  "fergana region",
  "namangan region",
  "jizzakh region",
  "samarkand region",
  "bukhara region",
  "kashkadarya region",
  "syrdarya region",
  "khorezm region",
  "surkhandarya region",
  "navoiy region",
];
////////////////////////////////////////////////////////////////////////

let count = 0
function filterByRegion(data) {
  // Initialize variables to store counts
  const regionCounts = {};

  // Function to normalize region names for comparison
function normalizeRegionName(regionName) {
    return regionName.toLowerCase();
}

  // Loop through the data
data.forEach(postamat => {
    const region = postamat.structured_address.region;
    const status = postamat.status;
    

    // Check if the region is defined and not null
    if (region) {
    // Normalize the region name for comparison
    const normalizedRegion = normalizeRegionName(region);

    // Check if the normalized region is in the array of normalized regions
    if (regions.map(normalizeRegionName).includes(normalizedRegion)) {
        // Initialize counts if not already done
        if (!regionCounts[normalizedRegion]) {
            
            regionCounts[normalizedRegion] = { online: 0, offline: 0 };
        }
        count++
        // Update counts based on status
        if (status === 'ОК') {
            regionCounts[normalizedRegion].online++;
            
        } else {
            regionCounts[normalizedRegion].offline++;
            
        }
    } else {
        if (!regionCounts[normalizedRegion]) {
            
            regionCounts[normalizedRegion] = { online: 0, offline: 0 };
        }
        // Update counts based on status
        if (status === 'ОК') {
            regionCounts[normalizedRegion].online++;
            
        } else {
            regionCounts[normalizedRegion].offline++;
            
        }
    }
} else {
    
    if (!regionCounts[region]) {
        regionCounts[postamat.settlement] = { online: 0, offline: 0 };
    }

    // Update counts based on status
    if (status === 'ОК') {
        regionCounts[postamat.settlement].online++;
    } else {
        regionCounts[postamat.settlement].offline++;
    }
}
});


// Sort the regions in descending order based on the "online" counts
const sortedRegions = Object.keys(regionCounts).sort((a, b) => regionCounts[b].online - regionCounts[a].online);

// Create a table
let table = '<pre>\n| Region  | Online | Offline |\n|---------|--------|---------|\n';

for (const region of sortedRegions) {
    const { online, offline } = regionCounts[region];
    // Truncate the region name to the first 8 characters and pad to 8 characters for alignment
    const truncatedRegion = (region.slice(0, 8) + '       ').slice(0, 8);
    // Pad online and offline counts to 7 characters for alignment
    const onlineCount = String(online).padStart(6, ' ');
    const offlineCount = String(offline).padStart(7, ' ');
    table += `|${truncatedRegion} | ${onlineCount} | ${offlineCount} |\n`;
}

table += '</pre>';
  return table;
}

module.exports = filterByRegion;
