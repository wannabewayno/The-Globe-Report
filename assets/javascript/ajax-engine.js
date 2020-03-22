
  // enable Bootstrap tool-tips
  $(function(){
    $('[data-toggle="tooltip"]').tooltip();
  });
  // get's user data
  function getdata(){
    const searchQuery = $('#search-bar').val()
    console.log(searchQuery);  
  }

  // triggers search function when the user hits enter
$('#search-bar').on('keypress',function(e) {
  if(e.which == 13) {
      e.preventDefault();
        search();
    }
  });

  function search(){
    endpointObject = constructEndPoint();
    for (endpoints in endpointObject){
      ajaxRequest(endpointObject[endpoints]);
    }
  }


  // get's user data
  function getdata(){
    const searchQuery = $('#search-bar').val()
    console.log(searchQuery);
    return searchQuery  
  }


   // * example APICall for current weather
      //  api.openweathermap.org/data/2.5/weather?q=London,uk&appid=9a7013d4177c90b845227eefa0b1fc23
  // * example APICall for 5 day forecast 
        //  api.openweathermap.org/data/2.5/forecast?q=London,uk&appid=9a7013d4177c90b845227eefa0b1fc23
  function constructEndPoint(){
    const APIkey = "&appid="+"9a7013d4177c90b845227eefa0b1fc23";// <-- API key
    const currentBase ="https://api.openweathermap.org/data/2.5/weather?";
    const forecastBase  = "https://api.openweathermap.org/data/2.5/forecast?";
    const cityName = "q="+getdata();
    const currentEndpoint = currentBase+cityName+APIkey;
    const forecastEndpoint = forecastBase+cityName+APIkey;
    const endpointObject ={
      currentWeather:currentEndpoint,
      forecast:forecastEndpoint
    }
    return endpointObject;
  }

  // takes in a url endpoint and triggers an AJAX get reguest to that endpoint
  function ajaxRequest(URL){
    $.ajax({
        url: URL,
        method: "GET"
      }).then(updateWeather);
  }

  // is called upon when an ajax response occurs.
  function updateWeather(AJAXresponse){
    console.log(AJAXresponse);

  }