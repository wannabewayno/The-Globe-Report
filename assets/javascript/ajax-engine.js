
//--------------------GlobalVariables-----------------------------
var savedSearches = retrieveLocalStorage(); //city list of previous searches
 

//----------------------------event triggers--------------------

  //listens for any button in the sidebar getting pressed
  $('#side-bar').click(function(event){
      clickedOnElement = $(event.target);

      if (clickedOnElement.is(".cityButton")){ //if the element is a cityButton (city name)

        toggleActive(clickedOnElement); // set this element to active, and remove any active states on other elements
        searchQuery = clickedOnElement.text(); // extract the city name from the clicked on element
        search(searchQuery);  // pass the city name as a search Query to the search function
      }
      if (clickedOnElement.is(".fa-window-close")){ // if an element corresponds to a close window icon;
        listItem = clickedOnElement.parent(); //get's the parent of the element (<li>, our city button)
        removeButton(listItem);
      }
  });

  // listens for the clear-all button to be pressed
  $('#clear-all').click(function(){ // when the clear-all button is pressed
    $('.cityButton').remove(); // remove anything that has the class "cityButton" (i.e all the cityButtons)
    wipeLocalStorage(); //also wipes local storage
    toggleClearAllButton();//checks to see if we need a clear all button
  })
  
  // triggers search function when the user hits enter
  $('#search-bar').on('keypress',function(event) {
    if(event.which === 13) {
        event.preventDefault();
        const searchBar = $(event.target);
        searchQuery = searchBar.val();
        search(searchQuery); //search function to be executed
      }
  });
//------------------------functions-----------------------------


function toggleActive(clickedOnElement){
  $(".active").toggleClass("active");
  if (clickedOnElement !== undefined){
    clickedOnElement.toggleClass("active");
  }
}

//if the side bar has cities saved, displays the 'Clear All Cities' button, otherwise hide it
function toggleClearAllButton(){
  if ($('.cityButton').length > 0){

    if($('.clear-all-list').hasClass("hide")){

      $('.clear-all-list').toggleClass("hide");
    }
  } else {
      $('.clear-all-list').toggleClass("hide");
  } 
}

  // passes the user's search query into constructEndPoint
    // constructEndPoint returns all endpoint urls you wish to make an AJAX call for. The information you want to retrieve is defined here.
      // the returned endpoints are stored in a flat object, with a dataType.
  // Loop through all endpoint URls stored in endpointObject, passing them to the ajaxRequest function with the dataType
  function search(searchQuery){
    endpointObject = constructEndPoint(searchQuery);
    for (endpoints in endpointObject){
      const endpoint = endpointObject[endpoints][0];
      const dataType = endpointObject[endpoints][1];
      ajaxRequest(endpoint,dataType);
    }
  }


  function constructEndPoint(searchQuery){
    const APIkey = "&appid="+"9a7013d4177c90b845227eefa0b1fc23";// <-- API key
    const endpointBase = "https://api.openweathermap.org/data/2.5/"//<-- Base https request
    const cityName = "q="+searchQuery; 
    const metricUnit = "&units=metric"
    const searchParameter = cityName+metricUnit+APIkey;

    const currentWeatherEndpoint = endpointBase+"weather?"+searchParameter;
    const forecastEndpoint = endpointBase+"forecast?"+searchParameter;

    const endpointObject ={
      currentWeather:[currentWeatherEndpoint,"currentWeather"],
      forecast:[forecastEndpoint,"forecast"]
    }
    return endpointObject;
  }

  // takes in a url endpoint and triggers an AJAX GET request to that endpoint
  function ajaxRequest(URL,dataType){
    $.ajax({
      url: URL,
      type: 'GET',
    })
    .done(function (data){ // call this function if a successful request is made
      if (dataType === "currentWeather"){
        updateCurrentWeather(data); // if successful request is the currentWeather
      }
      if (dataType === "forecast"){
        updateForecast(data); // if successful request is a 5-day forecast
      }
      if (dataType === "UVindex"){
        updateUVindex(data);// if successful request is the UV index
      }
    })
    .fail(function (jqXHR, textStatus, errorThrown){ // call this function in the even of an unsuccessful request
      error(textStatus);
    });
  }

  function error(textStatus){
    alert("whoops,"+textStatus);
  }

  // is called upon when a successfull ajax response of dataType "currentWeather" occurs
  function updateCurrentWeather(AJAXresponse){
    console.log(AJAXresponse);
    const cityName = AJAXresponse.name
    const country = AJAXresponse.sys.country
    const unambiguousCity = cityName+","+country;
    addToLocalStorage(unambiguousCity);
    const partOfDay = findTimeOfDay(AJAXresponse);
   
    $('#weather-header').html(unambiguousCity+" - "+partOfDay);
    $('#condition').text(AJAXresponse.weather[0].description);
    $('#temperature').text(AJAXresponse.main.temp +" °C");
    $('#humidity').text(AJAXresponse.main.humidity+" %");
    $('#wind-speed').text(getWind(AJAXresponse));
    $('#rain').text("0 mm");
    $('#condition-icon').attr("src", getImgSrc(AJAXresponse));
    getUVIndex(AJAXresponse);
  }

  function getImgSrc(AJAXresponse){
    const iconID = AJAXresponse.weather[0].icon;
    console.log(iconID);
    const base = "https://openweathermap.org/img/wn/";
    const suffix = "@2x.png";
    const source = base+iconID+suffix;
    return source;
  }

  function getWind(AJAXresponse){
    const windSpeed = AJAXresponse.wind.speed;
    windSpeedKmHr = windSpeed*3.6;
    const windUnit = "km/h"
    const windDirection = AJAXresponse.wind.deg;
    const compassDirection = degreesToCompass(windDirection);
    const windStatement = windSpeed+" "+windUnit+" - "+compassDirection;
    return windStatement;
  }

  function degreesToCompass(windDegrees){
    for (compassDirections in windLookUpTable){
      const lowerLimit = windLookUpTable[compassDirections].lowerLimit;
      const upperLimit = windLookUpTable[compassDirections].upperLimit;
      if (windDegrees>lowerLimit && windDegrees < upperLimit){
        return compassDirections
      } 
    }
    if (windDegrees>lowerLimit || windDegrees < upperLimit){
      return compassDirections;
    }
  }

  function localCityTime(AJAXresponse){
    const localTime = moment.utc();
    const targetTimeZone = (AJAXresponse.timezone)/60;
    const targetTime = localTime.utcOffset(targetTimeZone);
    return targetTime;
  }

  // finds the time of day and returns it with an icon.
  function findTimeOfDay(AJAXresponse){
    const targetTime = localCityTime(AJAXresponse);
    const dayOfWeek = targetTime.format("dddd");
    const hour = targetTime.hour();
    
    $("#local-time").text("Local time: "+targetTime.format("hA"));

    $("#icon").removeClass(); // removes current class to add more.
    if(hour > 4 && hour < 12){
      $("#icon").addClass("fa fa-coffee");
        return (dayOfWeek+" morning");
    } 

    if(hour > 12 && hour < 17){
      $("#icon").addClass("fa fa-sun");
        return (dayOfWeek+" afternoon");
    } 
   
    if(hour > 17 && hour < 21){
      $("#icon").addClass("fa fa-moon");
        return (dayOfWeek+" evening");
    } 
    
    if(hour > 21 || hour < 5){
      $("#icon").addClass("fa fa-star");
        return (dayOfWeek+" night");
    } 
  }

  // is called upon when a successfull ajax response of dataType "Forecast" occurs
  function updateForecast(AJAXresponse){
    $('.forecast-card').remove();
    const UTCoffset = (AJAXresponse.timezone)/60;
    targetTime = localCityTime(AJAXresponse);
    for (let i = 5; i < 35; i+=6) {
      const card = forecastCard(AJAXresponse.list[i],UTCoffset);
      $("#forecast").append(card);
    }
   
  }

  function forecastCard(forecastObject,UTCoffset){
    const forecastTime = moment.utc(forecastObject["dt_text"])
    const forecastDay = forecastTime.utcOffset(UTCoffset).format("ddd, hA");
    console.log(forecastDay);
    const title = forecastDay;

    const card = $('<div>').addClass("forecast-card");
    const cardTitle = $('<h6>').addClass("forecast-title");
    cardTitle.text(title)

    const conditionSection = $('<div>').addClass("forecast-condition-section")
    const condition = $('<h6>').addClass("forcast-condition");
    condition.text(forecastObject.weather[0].description)
    const picture = $('<img>').attr("src",getImgSrc(forecastObject));

    const statSection = $('<ul>').addClass("forecast-stat-section")
    const temp = $('<li>').text("Temperature: "+forecastObject.main.temp + "°C");
    const wind = $('<li>').text("Wind: "+getWind(forecastObject));
    const humidity = $('<li>').text("humidity: "+forecastObject.main.humidity+" %");

    conditionSection.append(picture, condition);
    statSection.append(temp,wind,humidity);
    card.append(cardTitle, conditionSection, statSection);
    return card;
  }

  function getUVIndex(AJAXresponse){
    // The uv index is a seperate AJAX call,
      // however it relies on latitude and longitude coordiantes to search.
    //this function finds latitude and longitude coords for the current city.
      // then performs a seperate AJAX request to find the UV index
    const APIkey = "&appid="+"9a7013d4177c90b845227eefa0b1fc23";// <-- API key
    const latitude = "lat="+AJAXresponse.coord.lat;
    const longitude = "&lon="+AJAXresponse.coord.lon;
    base = "https://api.openweathermap.org/data/2.5/uvi?"
    UVindexEndpoint ="https://api.openweathermap.org/data/2.5/uvi?"+latitude+longitude+APIkey;
    dataType = "UVindex"
    ajaxRequest(UVindexEndpoint,dataType);
  }

  // enables Bootstrap tool-tips
  $(function(){
    $('[data-toggle="tooltip"]').tooltip();
  });

  // is called upon when a successfull ajax response of dataType "UVindex" occurs
  function updateUVindex(AJAXresponse){
    console.log(AJAXresponse);
    const UVindex = AJAXresponse.value;
    $('#uv-index').tooltip('dispose'); //clears previous tool-tip
    //adds an appropritate background colour and tool-tip message to the UV index number.
    if(UVindex < 2){
      $('#uv-index').css("background-color" ,"limegreen");
      $('#uv-index').tooltip({placement: 'right', title:"low exposure"})
    }
    if(UVindex > 2 && UVindex < 5){
      $('#uv-index').css("background-color" ,"yellow");
      $('#uv-index').tooltip({placement:"right",title:"moderate exposure, wear protective clothing"});
    }
    if(UVindex > 5 && UVindex < 7){
      $('#uv-index').css("background-color" ,"orange");
      $('#uv-index').tooltip({placement:"right",title:"high exposure apply sunscreen every 2-hours"});
    }
    if(UVindex > 8 && UVindex < 10){
      $('#uv-index').css("background-color" ,"red");
      $('#uv-index').tooltip({placement:"right",title:"Very high, seek shade, apply sunscreen frequently"});
    }
    if(UVindex > 10){
      $('#uv-index').css("background-color" ,"purple");
      $('#uv-index').tooltip({placement:"right",title:"Extreme exposure, skin and eyes can burn in minutes."});
    }
    $('#uv-index').text(UVindex);
  }

  function retrieveLocalStorage(){
    var savedSearches = JSON.parse(localStorage.getItem("saved-searches"));
    if (savedSearches === null){
      savedSearches = {};
      return savedSearches;
    }
    for (cities in savedSearches){
      addButton(savedSearches[cities]);
      toggleActive();
    }
    return savedSearches;
  }

  function updateLocalStorage(){
    localStorage.setItem("saved-searches",JSON.stringify(savedSearches));
  }

  function wipeLocalStorage(){
     savedSearches = {};
    localStorage.clear();
  }

  function addToLocalStorage(cityName){
    // first we check to see if this city is already in our local storage
      // if so, find the city in our list, toggle it active and return out of the function early
    for (cities in savedSearches){
      if(savedSearches[cities] === cityName){
        const selector = "*:contains("+cityName+")";
        $(function() {
          const foundin = $(selector);
          toggleActive(foundin);
        });
        return
      }
    }
    // if we made it this far, the city is not in our local storage.
      // so add it to our master JSON file and update our localStorage
    savedSearches[cityName] = cityName
    updateLocalStorage();
    addButton(cityName) //anytime something is saved in localstorage add this search as a button to the saved-searches list
  }

  function removeFromLocalStorage(cityName){ // removes this city from our localStorage
    delete savedSearches[cityName]; //removes the city from the global JSON file ''savedSearches'
    updateLocalStorage(); //updates local storage with the modified JSON file 'savedSearches'
  }
  //adds a city to the sideBar and toggles it active.
    // first removes any toggled state already present in the sidebar
  function addButton(cityName){
    toggleActive();
    cityButton = $('<li>').addClass("active list-group-item d-flex justify-content-around align-items-baseline cityButton btn");
    cityText = $('<p>').text(cityName);
    cityText.addClass("cityButton");
    closeButton = $('<i>').addClass("fa fa-window-close");
    cityButton.append(cityText,closeButton);
    $('#saved-searches').prepend(cityButton);
    $('#search-bar').val("");
    toggleClearAllButton();//checks to see if we need a clear all button
  }

function removeButton(buttonToBeRemoved){
  cityName = buttonToBeRemoved.children("p").text(); // get's the name of the city in the button
  removeFromLocalStorage(cityName); // removes that city from local storage
  buttonToBeRemoved.remove(); // then removes the button itself
  toggleClearAllButton();//checks to see if we need a clear all button
}