const fs = require("fs");
require("dotenv").config();

const geoapifyApiKey = process.env.GEOAPIFY_API_KEY;

const fetchBoundary = async () => {
  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/boundaries/consists-of?id=5120e3fd2e8c2e5e40599a697ef277a52c40f00101f90138f1160000000000920306436176697465&geometry=geometry_1000&apiKey=${geoapifyApiKey}`
    );

    const data = await response.json();
    console.log("Geoapify API Response:", data);

    if (data.features && data.features.length >= 8) {
      const feature = data.features[7]; // 8th polygon (index 7)
      const geometry = feature.geometry;

      if (geometry.type === "Polygon") {
        const formattedBoundary = geometry.coordinates[0].map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]

        fs.writeFileSync("src/data/indangBoundary.json", JSON.stringify(formattedBoundary, null, 2));
        console.log("✅ Boundary saved to indangBoundary.json");
      } else {
        console.error("❌ Expected a Polygon but got:", geometry.type);
      }
    } else {
      console.error("❌ Not enough boundary data! Expected at least 8, but got:", data.features.length);
    }
  } catch (error) {
    console.error("🚨 Error fetching boundary data:", error);
  }
};

fetchBoundary();