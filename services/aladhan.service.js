async function fetchDailyPrayerData() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  const date = `${day}-${month}-${year}`;

  // const url = `https://api.aladhan.com/v1/timingsByAddress/${date}?address=tulsa%2C+us&method=2&shafaq=general&tune=5%2C3%2C5%2C7%2C9%2C-1%2C0%2C8%2C-6&calendarMethod=UAQ`;
  const url = `https://api.aladhan.com/v1/timings/${date}?latitude=36.09597494184466&longitude=-95.91169864767618`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`AlAdhan API request failed with status ${response.status}`);
  }

  const json = await response.json();

  if (!json?.data?.timings) {
    throw new Error("Invalid prayer timing data from AlAdhan API");
  }

  return {
    timings: json.data.timings,
    hijri: json.data.date?.hijri || null,
    gregorian: json.data.date?.gregorian || null,
    readable: json.data.date?.readable || null,
  };
}

module.exports = {
  fetchDailyPrayerData,
};