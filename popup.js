// REPLACE 'XXXXX' WITH YOUR UNIQUE API_KEY FROM AIRNOW API
const API_KEY = 'xxxxx';

// retrieve data set associated with PM.25
// fill in modal with data

async function fetchAirData(zipcode) {
  let res = await fetch(`https://cors-anywhere.herokuapp.com/http://www.airnowapi.org/aq/observation/zipCode/current/?format=json&zipCode=${zipcode}&distance=25&API_KEY=${API_KEY}`)
    .then(resp => resp.json())
    .then(dataSets => {
      let particleBasedAQI = {};

      for (let report of dataSets) {
        if (report["ParameterName"] === "PM2.5") {
          particleBasedAQI = { ...report };
        }
      }

      fillInModal(particleBasedAQI);
      return particleBasedAQI;
    });
}

// airnow api returns 0 - 23 as "LocalTimeZone"
// convert to AM/PM

function convertTime(num) {
  let conversionObj = {
    0: '12 AM',
    1: '1 AM',
    2: '2 AM',
    3: '3 AM',
    4: '4 AM',
    5: '5 AM',
    6: '6 AM',
    7: '7 AM',
    8: '8 AM',
    9: '9 AM',
    10: '10 AM',
    11: '11 AM',
    12: '12 PM',
    13: '1 PM',
    14: '2 PM',
    15: '3 PM',
    16: '4 PM',
    17: '5 PM',
    18: '6 PM',
    19: '7 PM',
    20: '8 PM',
    21: '9 PM',
    22: '10 PM',
    23: '11 PM'
  };

  return conversionObj[num];
}

// fill in modal with data
// and change color of air quality based on quality category

function fillInModal(data) {
  let category = data["Category"]["Name"];

  let airQuality = document.getElementById('air-quality');
  airQuality.innerText = `${data["AQI"]} (${category})`;
  // eg 90 Moderate

  let airQualityColor = '';

  if (category === "Good") {
    airQualityColor = '#00B500';
  } else if (category === "Moderate") {
    airQualityColor = '#C7C704';
  } else if (category === "Unhealthy for Sensitive Groups") {
    airQualityColor = '#FF6600';
  } else if (category === "Unhealthy") {
    airQualityColor = '#FF0000';
  } else if (category === "Very Unhealthy") {
    airQualityColor = '#99004C';
  } else if (category === "Hazardous") {
    airQualityColor = '#7E0023';
  } else if (category === "Unavailable") {
    airQualityColor = '#338DFF';
  }

  airQuality.style.color = airQualityColor;

  // build airnow link with information about user's zipcode

  document.getElementById('updated-info').innerHTML = `
  <a id="airnow-link" href="https://www.airnow.gov/?city=${data["ReportingArea"]}
  &state=${data["StateCode"]}
  &country=USA">
  ${convertTime(data["HourObserved"])} (${data["LocalTimeZone"]})</a>`;

  let airNowPointer = document.getElementById('airnow-link');

  // clicking on the link opens a new tab
  // tab points to airnow's page for the given zipcode
  airNowPointer.addEventListener('click', function () {
    var airNowLink = airNowPointer.href;
    chrome.tabs.create({ url: airNowLink });
  });
}


document.addEventListener('DOMContentLoaded', function () {
  // use zipcode from localstorage if it exists
  if (localStorage["airqZipCode"]) {
    fetchAirData(localStorage.getItem("airqZipCode"));
  }

  // if zipcode not in localstorage 
  // or if user uses new zipcode, 
  // search with zipcode from form and update zipcode in localstorage
  let zipCodeForm = document.getElementById('zipcode-form');

  zipCodeForm.addEventListener('submit', function (evt) {
    evt.preventDefault();

    let query = document.getElementById('zipcode-query').value;
    fetchAirData(query);
    localStorage.setItem('airqZipCode', query);
  });
});