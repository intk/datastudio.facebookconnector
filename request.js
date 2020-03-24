function getDataFromAPI(requestedMetric,startDate,endDate,pageToken,requestEndpoint)
{
  console.log("Get Data : ",requestedMetric);
  const maxTimeDifference = 90*24*60*60;
  const oneDay = 24*60*60;

  var startDateMs = (new Date(startDate).getTime() / 1000) - oneDay;

  //Everything is shifted 2 days so we have to move the end date as well
  var endDateMs = (new Date(endDate).getTime() / 1000) + 3*oneDay;

  var baseUrl = requestEndpoint+"insights?metric=";


  baseUrl += requestedMetric;



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
      //console.log(apiresponse.data[0].values);

    }

    //rest of the day
    var custom_url = baseUrl  + "&period=day&since="+startIntervalDate +"&until="+endDateMs +"&access_token="+pageToken;
    //console.log(custom_url);
    apiresponse.data[0].values = apiresponse.data[0].values.concat(JSON.parse(UrlFetchApp.fetch(custom_url)).data[0].values);
    //console.log(apiresponse);
    //console.log(apiresponse.data[0].values);


    return apiresponse;
  }
  else
  {
    console.log('Less than 90 days');
    var custom_url = baseUrl  + "&period=day&since="+startDateMs +"&until="+endDateMs +"&access_token="+pageToken;
    console.log(custom_url);

    var resp = UrlFetchApp.fetch(custom_url);
    //console.log(resp.getAllHeaders());
    //console.log(resp);

    var apiresponse =  JSON.parse(resp);
    //console.log(apiresponse);
    return apiresponse;
  }
}

function getAllDataFromAPI(requestedMetrics,startDate,endDate,pageToken,requestEndpoint)
{

  //If days is requested, no need to get this from the API, the days are collected in each calls
  const index = requestedMetrics.indexOf("day");
  if (index > -1) {
    requestedMetrics.splice(index, 1);
  }




  requestedMetrics = removeGenderAge(requestedMetrics);

  console.log('requestedMetrics:',requestedMetrics);

  var dataList = [];

  requestedMetrics.forEach(function(metric) {
    console.log("Loop ");

    if(metric=="page_fans") {
        console.log('page_fans');
        var endDateMs = (new Date(endDate).getTime() / 1000) + 3*24*60*60;
        var custom_url = requestEndpoint+"insights?metric=page_fans"+"&period=day&since="+endDateMs +"&until="+endDateMs +"&access_token="+pageToken;
        console.log(custom_url);
        var response = JSON.parse(UrlFetchApp.fetch(custom_url));
    }
    else
    {
        var response = getDataFromAPI(metric,startDate,endDate,pageToken,requestEndpoint);
    }

    dataList.push(response);
  });

  console.log("Total Response : ",dataList);

  //get the minimum number of days
  var minDays = Math.min.apply(null,dataList.map(function(item) {
    return item.data[0].values.length;

  }));

  console.log('Min day',minDays)

  //Group by day
  var days = [];

  for (var day = 0; day < minDays; day++) {

    //Empty object
    var newDay = {};

    newDay.date = dataList[0].data[0].values[day].end_time;
    var date = new Date(newDay.date); //.toISOString().slice(0, 10).replace(/-/g, "");

    //Adjust date to be as on Facebook Insight
    date.setDate(date.getDate()-1);

    // Google expects YYYYMMDD format
    newDay.date = date.toISOString().slice(0, 10).replace(/-/g, "");

    //newDay.date = date;
    dataList.forEach((item, i) => {

          //Special process for gender_age
      if(item.data[0].name == 'page_fans_gender_age')
      {
        retrieveGender(item.data[0].values[day].value,newDay)
      }
      else
      {
        //For each metrics we add the value of the day in a field named by the name of the metric
         newDay[item.data[0].name] = item.data[0].values[day].value
      }
    });
    days.push(newDay);
  }

  //We have now a list of day with sorted metrics
  console.log('Days',days)

  return days;

}




function removeGenderAge(requestedMetrics)
{
  // If all the metrics for gender and age are required, remove them.
  // For the api it's just one call so it doesn't make sense to request all those metrics
  //Instead just request page_fans_gender_age  and process the result
  var removed = 0;

  const indexMaleGender = requestedMetrics.indexOf("male_gender");
  if (indexMaleGender > -1) {
    requestedMetrics.splice(indexMaleGender, 1);
    removed=1;
  }
  const indexFemaleGender = requestedMetrics.indexOf("female_gender");
  if (indexFemaleGender > -1) {
    requestedMetrics.splice(indexFemaleGender, 1);
    removed=1;
  }
  const indexUnknownGender = requestedMetrics.indexOf("unknown_gender");
  if (indexUnknownGender > -1) {
    requestedMetrics.splice(indexUnknownGender, 1);
    removed=1;
  }

  if(removed==1)
  {
    requestedMetrics.push('page_fans_gender_age')
  }

  return requestedMetrics;

}
