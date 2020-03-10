var cc = DataStudioApp.createCommunityConnector();

var startTimer = 0;

function getConfig() {
  var config = cc.getConfig();

  config.newInfo()
   .setId('instructions')
  .setText('Please enter the configuration data for your Facebook connector');

  config.newTextInput()
      .setId('page_id')
      .setName('Enter your Facebook Page Id')
      .setHelpText('Find the page Id on the \'About\' section of your page')
      .setPlaceholder('Enter Facebook Page Id here')
      .setAllowOverride(false);

  config.setDateRangeRequired(true);

  return config.build();
}


function getFields(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;

  fields.newMetric()
    .setId('page_fan_adds')
    .setType(types.NUMBER)

  fields.newDimension()
    .setId('day')
    .setType(types.YEAR_MONTH_DAY);
    
  return fields;
}

function getSchema() {
  return {
    schema: [
      {
        name: 'page_fan_adds',
        label: 'New Page likes',
        dataType: 'NUMBER',
        semantics: {
          conceptType: 'METRIC'
        }
      },
      {
        name: 'day',
        label: 'Day',
        dataType: 'STRING',
        semantics: {
          conceptType: 'DIMENSION',
          semanticGroup: 'DATETIME',
          semanticType: 'YEAR_MONTH_DAY'
        }
      }
    ]
  };
}




function getData(request) {

  //Calculation of the time of the getData function
  startTime = Date.now();
  
  //var t0 = Performance.now();
  //console.log(t0);
  
  console.log(request);

  //Extract info from request
  var pageId = request.configParams['page_id'];
  var startDate = request.dateRange.startDate;
  var endDate = request.dateRange.endDate;

  var requestEndpoint = "https://graph.facebook.com/v6.0/"+pageId+"/"


  //create de schema for the data
  var dataSchema = [];
  var fixedSchema = getSchema().schema;
  request.fields.forEach(function(field) {
    for (var i = 0; i < fixedSchema.length; i++) {
      if (fixedSchema[i].name == field.name) {
        dataSchema.push(fixedSchema[i]);
        break;
      }
    }
  });


  //Get the page token
  var tokenUrl = requestEndpoint+"?fields=access_token";
  var tokenResponse = UrlFetchApp.fetch(tokenUrl,
      {
        headers: { 'Authorization': 'Bearer ' + getOAuthService().getAccessToken() },
        muteHttpExceptions : true
      });
  var pageToken = JSON.parse(tokenResponse).access_token;




  var metrics = ['page_fan_adds'];
  //var metrics = ['page_fans','page_fans_paid','page_impressions','page_impressions_paid','page_fans_country','page_fans_gender_age','page_fan_adds'];

  //Get data from API
  var response = getDataFromAPI(metrics,startDate,endDate,pageToken,requestEndpoint);

  // Parse the result
  //var parsedResponse = JSON.parse(response).data[0].values;
  var parsedResponse = response.data[0].values;
  
  var endTime = Date.now();
  
  console.log(endTime-startTime);
  var timeRequest = endTime-startTime;

  var data = [];
  parsedResponse.forEach(function(fans) {
    var values = [];

    var fansTime = new Date(fans.end_time);
    
    /*
    console.log(fansTime);
    fansTime.setDate(fansTime.getDate()-2);
    console.log(fansTime);
    
    */
    
    // Google expects YYMMDD format
    var fansDate = fansTime.toISOString().slice(0, 10).replace(/-/g, "");

    // Provide values in the order defined by the schema.
    dataSchema.forEach(function(field) {
      switch (field.name) {
      case 'page_fan_adds':
        values.push(fans.value);
        break;
      case 'day':
        values.push(fansDate);
        break;
      }
    });
    data.push({
      values: values
    });
  });

  return {
    schema: dataSchema,
    rows: data
  };

}


// Use for debug only, allow us to see the error code in data studio when somethhing is wrong.
function isAdminUser(){
 var email = Session.getEffectiveUser().getEmail();
  if( email == 'steven@itsnotthatkind.org' || email == 'analyticsintk@gmail.com' || email == 'quentin@itsnotthatkind.org'){
    return true;
  } else {
    return false;
  }
}



/**** BEGIN: OAuth Methods ****/
//ref : https://stickler.de/informationen/data-analytics/kostenloser-facebook-ads-google-datastudio-connector
function getAuthType() {
  var response = { type: 'OAUTH2' };
  return response;
}

function resetAuth() {
  getOAuthService().reset();
}

function isAuthValid() {
  return getOAuthService().hasAccess();
}

function getOAuthService() {
  return OAuth2.createService('exampleService')
    .setAuthorizationBaseUrl('https://www.facebook.com/dialog/oauth')
    .setTokenUrl('https://graph.facebook.com/v5.0/oauth/access_token')
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCallbackFunction('authCallback')
    .setScope('pages_show_list, manage_pages, read_insights');
};

function authCallback(request) {
  var authorized = getOAuthService().handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  };
};

function get3PAuthorizationUrls() {
  return getOAuthService().getAuthorizationUrl();
}

/**** END: OAuth Methods ****/