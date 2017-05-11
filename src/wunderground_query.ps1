#Static Variables
$WUNDERGROUND_API_KEY = "c814c56054a82500"
$WUNDERGROUND_PWS_ID = "KIAIOWAC38"
$WUNDERGROUND_BASE_URL = "http://api.wunderground.com/api/"
$WUNDERGROUND_CONDITIONS_return_URL = "/conditions/q/pws:"
$WUNDERGROUND_ALERTS_URL = "/alerts/q/pws:"
$RESPONSE_FORMAT = ".json"

#Form the URIs based on static variables
$UriConditions_return = $WUNDERGROUND_BASE_URL + $WUNDERGROUND_API_KEY + $WUNDERGROUND_CONDITIONS_return_URL + $WUNDERGROUND_PWS_ID + $RESPONSE_FORMAT
$UriAlerts = $WUNDERGROUND_BASE_URL + $WUNDERGROUND_API_KEY + $WUNDERGROUND_ALERTS_URL + $WUNDERGROUND_PWS_ID + $RESPONSE_FORMAT

$conditions_return = Invoke-RestMethod -Uri $UriConditions_return -Method Get -ContentType json
$alerts_return = Invoke-RestMethod -Uri $UriAlerts -Method Get -ContentType json

$temp_rnd = [math]::Round($conditions_return.current_observation.temp_f)
$dewpoint_rnd = [math]::Round($conditions_return.current_observation.dewpoint_f)
$feelslike = [math]::Round($conditions_return.current_observation.feelslike_f)
$baro_pressure_trend = $conditions_return.current_observation.pressure_trend
$baro = $conditions_return.current_observation.pressure_in
$wind_speed = [math]::Round($conditions_return.current_observation.wind_mph)
$wind_gust = [math]::Round($conditions_return.current_observation.wind_gust_mph)
$wind_abrev = $conditions_return.current_observation.wind_dir
$precip_in = $conditions_return.current_observation.precip_today_in
$observation = $conditions_return.current_observation.weather
$alerts = $alerts_return.alerts

#Alert variables
$alert_type = $alerts.description
$alert_expire = $alerts.expires_epoch
$alert_timezone = $alerts.tz_short

#Time shifting and logic for expiration time/date
$origin = New-Object -Type DateTime -ArgumentList 1970, 1, 1, 0, 0, 0, 0
$expiration_datetime_utc = $origin.AddSeconds($alert_expire)

#Determine if coming from central daylight/savings. If not, GMT for you.
$CurrentDate = Get-Date
if($alert_timezone -eq "CDT"){
    $expiration_datetime = $expiration_datetime_utc.AddHours(-5)
}elseif($alert_timezone -eq "CST"){
    $expiration_datetime = $expiration_datetime_utc.AddHours(-6)
}else{
    $expiration_datetime = $expiration_datetime_utc
    $CurrentDate = (Get-Date).ToUniversalTime()
}
#Logic to handle if the alert expires today, tomorrow, or another day for more natural speech
if($expiration_datetime.ToShortDateString() -eq $CurrentDate.ToShortDateString()){
    $expires = $expiration_datetime.ToShortTimeString()
}elseif($expiration_datetime.DayOfWeek -eq $CurrentDate.AddDays(1).DayOfWeek){
    $expires = $expiration_datetime.ToShortTimeString() + " tomorrow."
}else{
    $expires = $expiration_datetime.ToShortTimeString() + " on " + $expiration_datetime.DayOfWeek + "."
}
if ($alert_timezone -like "C*"){
    $alerts_speech = "WEATHER ALERT! There is a $alert_type in effect until $expires" + '<break time="1s"/>'
}else{
    $alerts_speech = ""
}

#Observation natural speech
$weather_obs = "Currently, your personal weather station reports $observation"

#Dewpoint cannot exceed temperature. Fix for WU's API reporting round numbers for dewpoint, but decimal for temp
if($dewpoint_rnd -gt $temp_rnd){
    $dewpoint_rnd = $temp_rnd
    $temp = ", with a temperature and a dewpoint of $temp_rnd."
}else{
    $temp = ", with a temperature of $temp_rnd, and a dewpoint of $dewpoint_rnd."
}

#Feels like temp
if($temp_rnd = $feelslike){
    $temp_feelslike = ""
}else{
    $temp = " It feels like $feelslike."
}

#Wind direction
switch ($wind_abrev) {
    "North" {$wind_dir = "from the north"}
    "NE" {$wind_dir = "from the northeast"}
    "ENE" {$wind_dir = "from the east northeast"}
    "East" {$wind_dir = "from the east"}
    "ESE" {$wind_dir = "from the east southeast"}
    "SE" {$wind_dir = "from the southeast"}
    "SSE" {$wind_dir = "from the south southeast"}
    "South" {$wind_dir="from the south"}
    "SSW" {$wind_dir="from the south southwest"}
    "SW" {$wind_dir = "from the southwest"}
    "WSW" {$wind_dir = "from the west southwest"}
    "West" {$wind_dir = "from the west"}
    "WNW" {$wind_dir = "from the west northwest"}
    "NW" {$wind_dir = "from the northwest"}
    "NNW" {$wind_dir = "from the north northwest"}
    "Variable" {$wind_dir = "variable"}
}

#Wind logic
if($wind_speed -lt 3){
    $winds = " Winds are calm."
}elseif(($wind_gust - $wind_speed) -ge 10){
    $winds = " Winds are from the $wind_dir at $wind_speed, gusting to $wind_gust miles per hour."
}else{
    $winds = " Winds are from the $wind_dir at $wind_speed miles per hour."
}

#Barometric Pressure Logic
switch ($baro_pressure_trend) {
    "+" {$trend = "rising"}
    "-" {$trend = "falling"}
    Default {$trend = "steady"}
}
$pressure = " The barometric pressure is $baro inches, and $trend."

#Precipitation
if($precip_in -le 0.01){
    $precip = ""
}else{
    $precip = " There has been measurable precipitation of $precip_in inches so far today."
}
$speech_return = "<speak>" + $alerts_speech + $weather_obs + $temp + $winds + $pressure + $precip + "</speak>"
$speech_hash = @{"string" = "$speech_return"}
$retval = ConvertTo-Json -InputObject $speech_hash

Out-File -Encoding utf8 -FilePath $res -inputObject "$retval"