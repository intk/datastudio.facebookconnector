function getDataFromAPI(requestedMetric,startDate,endDate,pageToken,requestEndpoint)
{
  console.log(requestedMetric);
  const maxTimeDifference = 90*24*60*60;
  const oneDay = 24*60*60;
  
  var startDateMs = (new Date(startDate).getTime() / 1000) - oneDay;
  var endDateMs = (new Date(endDate).getTime() / 1000) + oneDay;
  
  var baseUrl = requestEndpoint+"insights?metric=";
  
  requestedMetric.forEach((metric) => {
    baseUrl += metric;
    baseUrl += ',';
  })
  
 
  
  if(endDateMs-startDateMs > maxTimeDifference)
  {
    console.log('More than 90 days')
    var startIntervalDate = startDateMs;
    var endIntervalDate = startIntervalDate + maxTimeDifference;
    
    var apiresponse = [];
    while(endIntervalDate<endDateMs)
    {
    
      var custom_url = baseUrl + "&period=day&since="+startIntervalDate +"&until="+endIntervalDate +"&access_token="+pageToken;
      console.log(custom_url);

      
      // if list empty push the complete response
      if(apiresponse.length == 0) {
        apiresponse = JSON.parse(UrlFetchApp.fetch(custom_url));
      }
      else // just append to the values list
      {
        apiresponse.data[0].values = apiresponse.data[0].values.concat(JSON.parse(UrlFetchApp.fetch(custom_url)).data[0].values);
      }
      startIntervalDate = startIntervalDate + maxTimeDifference - oneDay;
      endIntervalDate = endIntervalDate + maxTimeDifference - oneDay;
      console.log(apiresponse.data[0].values);

    }
    
    //rest of the day
    var custom_url = baseUrl  + "&period=day&since="+startIntervalDate +"&until="+endDateMs +"&access_token="+pageToken;
    console.log(custom_url);
    apiresponse.data[0].values = apiresponse.data[0].values.concat(JSON.parse(UrlFetchApp.fetch(custom_url)).data[0].values);
    console.log(apiresponse);
    //console.log(apiresponse.data[0].values);

    
    return apiresponse;
  }
  else
  {
    console.log('Less than 90 days');
    var custom_url = baseUrl  + "&period=day&since="+startDateMs +"&until="+endDateMs +"&access_token="+pageToken;
    console.log(custom_url);

    var resp = UrlFetchApp.fetch(custom_url);
    console.log(resp);

    var apiresponse =  JSON.parse(resp);
    console.log(apiresponse);
    return apiresponse;
  }  
}


function getMetrics(metricsList,startDate,endDate,pageToken,requestEndpoint) {
    // Will get all the different metrics and merge the result
}