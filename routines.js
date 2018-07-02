var day_in_ms = 86400000; // day in milliseconds

var $routines = document.getElementById('routines');
var user = $routines.getAttribute('data-user');
var data;

// this cycles through array in infinite loop, when it gets to last item it continues from first
// function returns index of target item
function cycleThroughArray(starting_position, steps, array_length) {
    var result = starting_position;

    for (var i = 0; i < steps; i++) {
        result = (result+1 < array_length) ? result+1 : 0;
    }

    return result;
}

// get day in YYYY-MM-DD format
// based on https://stackoverflow.com/a/3067896/716001
function getDay(date) {
    var mm = date.getMonth() + 1; // getMonth() is zero-based, therefore +1
    var dd = date.getDate();

    return [date.getFullYear(),
        (mm>9 ? '' : '0') + mm,
        (dd>9 ? '' : '0') + dd
    ].join('-');
};

// how many days between dates
// based on https://stackoverflow.com/a/15289883/716001
function dateDiffInDays(a, b) {
  // Discard the time and time-zone information.
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / day_in_ms);
}

// new day
function checkNewDay() {
    if (!data) {return;}

    //var today = getDay(new Date('2018-03-08T15:04:17.542Z'));
    var today = getDay(new Date());

    // if another day
    if (data.last_check !== today) {

        // days since last check
        var days_since_last_check = dateDiffInDays(new Date(data.last_check), new Date(today));

        // add one day without fail (if anything failed, it will be set to 0 later)
        data.days_without_fail = data.days_without_fail+days_since_last_check || 1; // TODO remove || 1, it's there to introduce new feature without errors 

        // loop through all routines
        for (var i=0; i < data.routines.length; i++) {
            // if NO type routine
            if (data.routines[i].no) {
                // add days since last check
                var days_to_add = days_since_last_check;

                // if not done the last check
                if (!data.routines[i].done) {
                    // deduct one day
                    days_to_add = days_to_add-1;

                    // reset days without fail to 0
                    data.days_without_fail = 0;

                }

                // adjust number of days
                data.routines[i].days = data.routines[i].days+days_to_add;

                // if there are sub-tasks
                if (data.routines[i].sub) {
                    // go to next task
                    data.routines[i].sub.pos = cycleThroughArray(data.routines[i].sub.pos, days_to_add, data.routines[i].sub.tasks.length);
                }

                // reset state to 'done'
                data.routines[i].done = true; // this has to be done after state from day of last check checked
            }
            // NORMAL routine
            else {
                // if last check was yesterday and it was done
                if (days_since_last_check === 1 && data.routines[i].done) {
                    // check if there are sub-tasks...
                    if (data.routines[i].sub) {
                        // ...and go to next task
                        data.routines[i].sub.pos = cycleThroughArray(data.routines[i].sub.pos, 1, data.routines[i].sub.tasks.length);
                    }
                }
                // if last check was NOT yesterday or it was NOT done
                else {
                    // reset day count
                    data.routines[i].days = 0;

                    // reset count of days without fail
                    data.days_without_fail = 0;
                }

                // reset state to 'not done'
                data.routines[i].done = false;
            }
        }

        // re-draw view
        renderRoutines(data);

        // update date
        data.last_check = today;

        // store updated date
        if (user) {
            // store in db
        }
        else {
            localStorage.setItem('routines', JSON.stringify(data));
        }
    }
}

function moveDataToDB () {

    // save marker that data moved to db
    localStorage.setItem('routines', JSON.stringify({'moved': 1}));

}

function renderRoutines(data) {
    var routines = data.routines;
    var html = '', icon = '', fill = '', path = '', state_title = '';
    var checkmark = 'M1412 734q0-28-18-46l-91-90q-19-19-45-19t-45 19l-408 407-226-226q-19-19-45-19t-45 19l-91 90q-18 18-18 46 0 27 18 45l362 362q19 19 45 19 27 0 46-19l543-543q18-18 18-45zm252 162q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z';
    var frownyface = 'M1262 1229q8 25-4 48.5t-37 31.5-49-4-32-38q-25-80-92.5-129.5t-151.5-49.5-151.5 49.5-92.5 129.5q-8 26-31.5 38t-48.5 4q-26-8-38-31.5t-4-48.5q37-121 138-195t228-74 228 74 138 195zm-494-589q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm512 0q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm256 256q0-130-51-248.5t-136.5-204-204-136.5-248.5-51-248.5 51-204 136.5-136.5 204-51 248.5 51 248.5 136.5 204 204 136.5 248.5 51 248.5-51 204-136.5 136.5-204 51-248.5zm128 0q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z';

    for (var i=0; i < routines.length; i++) {
        // any routine done
        if (routines[i].done) {
            // green check
            fill = '#67c013';
            path = checkmark;
            state_title = ' Marked as done ';
        }
        else {
            // if NO routine not done
            if (routines[i].no) {
                // gray frowny face
                fill = '#ea0000';
                path = frownyface;
                state_title = ' The chain was broken but tomorrow is another day ';
            }
            else {
                // if normal routine not done
                fill = '#eaeaea';
                path = checkmark;
                state_title = ' Click to mark as done ';
            }
        }

        // if there are sub-tasks
        var tasks = '';
        if (routines[i].sub) {
            tasks = ': '+'<span class="task">'+routines[i].sub.tasks[routines[i].sub.pos]+' <span data-id="'+routines[i].id+'" class="skip" title=" Skip to the next sub-task ">&#9656;</span></span>';
        }

        html = html+'<div class="routine">'+
        '<svg data-id="'+routines[i].id+'" class="state" fill="'+fill+'" width="28" height="28" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="'+path+'"/>'+
        '<title>'+state_title+'</title></svg>'+
        '<a href="edit.html?routine='+routines[i].id+'" class="name" title=" View/edit routine details ">'+routines[i].name+'</a>'+tasks+'<div class="days">'+routines[i].days+'</div></div>';
    }

    // if more routines than 1, append the magic number of days without fail
    var magic_number = '';
    if (routines.length > 1 && data.days_without_fail > 0) {
        // TODO prepend words like 'nice', 'awesome' or 'glorious' based on number of words?
        magic_number = '<div id="magic_number"><div id="days_without_fail">'+data.days_without_fail+'</div> day'+(data.days_without_fail>1 ? 's' : '')+' without fail<br />midnight to midnight.</div>';
    }

    $routines.innerHTML = html+magic_number;

    // grab all .state elements and attach click listeners
    var states = document.getElementsByClassName("state");
    for (var i = 0; i < states.length; i++) {
        states[i].addEventListener('click', toggleState, false);
    }

    // grab all .skip elements and attach click listeners
    var skips = document.getElementsByClassName("skip");
    for (var i = 0; i < skips.length; i++) {
        skips[i].addEventListener('click', skipForward, false);
    }
}

function toggleIcon(icon, state) {
    icon.style.fill = (state ? '#6fe600' : '#eaeaea');
}

// go to next sub-task 
function skipForward() {
    // get ID of pack to be skipped
    var routine_to_skip = this.getAttribute("data-id");

    if (user) {

    }
    else {
        // loop through routines
        for (var i=0; i<data.routines.length; i++) {
            // find the routine to edit
            if (data.routines[i].id == routine_to_skip) {

                // jump one sub-task forward
                data.routines[i].sub.pos = cycleThroughArray(data.routines[i].sub.pos, 1, data.routines[i].sub.tasks.length);

                // re-draw view
                renderRoutines(data);

                // store data
                localStorage.setItem('routines', JSON.stringify(data));

                break;
            }
        }
    }
}

function toggleState() {
    // get ID of routine to be toggled
    var routine_to_toggle = this.getAttribute("data-id");

    if (user) {

    }
    else {
        // loop through routines
        for (var i=0; i<data.routines.length; i++) {
            // find the routine to edit
            if (data.routines[i].id == routine_to_toggle) {

                // handle state and update days
                // if NO routine 
                if (data.routines[i].no) {
                    // No routine can only by changed to 'not done'
                    if (data.routines[i].done) {
                        // if chain longer than 10 days
                        if (data.routines[i].days > 10) {
                            // throw a warning
                            if (confirm('Did you break the chain of '+data.routines[i].days+' days?')) {
                                data.routines[i].done = 0;
                                data.routines[i].days = 0;

                                data.days_without_fail = 0;
                            }
                        }
                        else {
                            data.routines[i].done = 0;
                            data.routines[i].days = 0;

                            data.days_without_fail = 0;
                        }
                    }
                    else {
                        // TODO - implement undo if clicked by mistake?
                        alert('You cannot un-break what has been broken.');
                    }
                }
                // if normal routine
                else {
                    // change state to opposite state
                    data.routines[i].done = !data.routines[i].done;

                    // if new state is 'done'
                    if (data.routines[i].done) {
                        // add one day
                        data.routines[i].days = data.routines[i].days + 1;
                    }
                    else {
                        // deduct one day 
                        data.routines[i].days = data.routines[i].days - 1;
                    }
                }

                // save change
                localStorage.setItem('routines', JSON.stringify(data));

                // // change color of shuffle icon
                // toggleIcon(this, data.routines[i].done);

                // re-draw view
                renderRoutines(data); // TODO is it good to re-draw the whole view when anything changes?

                break;
            }
        }
    }
}


// LOAD DATA

// if user logged in
if (user) {
    // get data from server

    // render data
    renderRoutines(data);
}
else {
    // try to get data from local storage
    data = JSON.parse(localStorage.getItem('routines'));
    data = {"last_check":'2018-07-02',"days_without_fail":97,"routines":[{"name":"No sweets","note":"Ne buchty, čokolády, oplatky, medovníky atp. Smím buchty od mamky, darované sladkosti, dobroty na svatbách, když pozvu dámu do cukrárny a podobně. ","days":127,"done":true,"no":true,"id":308258},{"name":"No P","note":"No porn. ","days":97,"done":true,"no":true,"id":151941}]};localStorage.setItem('routines', JSON.stringify(data));

    if (data) {
        // logged in before, data moved to db
        if (data.moved) {
            // remind user to log in
        }
        else {
            // never logged in, uses app, data stored locally
            renderRoutines(data);
        }
    }
    else {
        // TODO load explainer
        $routines.innerHTML = '<p>Explainer will be here...</p>';
    }
}


// new day?
checkNewDay(); // check on load
setInterval(function() {
    checkNewDay();
//}, 60000); // check each minute
}, 1000); // check each second


// remove #_=_ artefact left after facebook login
if (window.location.hash == '#_=_'){
    history.replaceState 
        ? history.replaceState(null, null, window.location.href.split('#')[0])
        : window.location.hash = '';
}