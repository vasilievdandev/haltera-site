// The share-link page (p.html, w.html): reads the link after `#` (link.js) and shows the plan or
// the finished workout, in the PURE look of the app. Nothing is sent anywhere: the data is in
// the link itself and the browser never sends the part after `#` to the server.
(function () {
  var D = window.HALTERA_DATA;
  var app = document.getElementById('app');
  var WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var AREA_ICON = {
    chest: 'muscle-chest',
    back: 'muscle-back',
    shoulders: 'muscle-shoulders',
    arms: 'muscle-arms',
    legs: 'muscle-legs',
    core: 'muscle-core',
    cardio: 'health',
  };
  var AREA_LABEL = {
    chest: 'Chest',
    back: 'Back',
    shoulders: 'Shoulders',
    arms: 'Arms',
    legs: 'Legs',
    core: 'Core',
    cardio: 'Cardio',
  };

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function glyph(name, size) {
    var paths = (D.glyphs[name] || [])
      .map(function (d) {
        return '<path d="' + d + '"/>';
      })
      .join('');
    return (
      '<svg class="glyph" width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24" ' +
      'aria-hidden="true">' +
      paths +
      '</svg>'
    );
  }

  function num(n) {
    return (Math.round(n * 10) / 10).toLocaleString('en-US');
  }

  function exerciseName(id, custom) {
    if (custom[id]) return custom[id];
    if (D.exercises[id]) return D.exercises[id][0];
    return id.replace(/-/g, ' ').replace(/^./, function (c) {
      return c.toUpperCase();
    });
  }

  // [exerciseId, sets, reps, weight, restSec, options?] → "4 × 8 · 80 kg".
  function setsText(row) {
    var o = row[5] || {};
    var text;
    if (o.s && o.s.length) {
      text = o.s
        .map(function (s) {
          return (s[0] > 0 ? num(s[0]) + ' kg × ' : '') + s[1];
        })
        .join(', ');
    } else {
      text = row[1] + ' × ' + row[2] + (row[3] > 0 ? ' · ' + num(row[3]) + ' kg' : '');
    }
    var extras = [];
    if (o.u) extras.push('warm-up');
    if (o.d) extras.push('drop set');
    if (o.e) extras.push('drop after each set');
    if (o.p === 'y') extras.push('pyramid');
    if (o.p === 'r') extras.push('reverse pyramid');
    return { text: text, extras: extras };
  }

  function dayCard(day, label, custom) {
    var rows = day[1];
    if (!rows || !rows.length) return '';
    var html = '<section class="card">';
    if (label) html += '<div class="eyebrow">' + esc(label) + '</div>';
    html += '<h2>' + esc(day[0] || 'Workout day') + '</h2><ul class="list">';
    rows.forEach(function (row) {
      var sets = setsText(row);
      var group = row[5] && row[5].g;
      if (group) sets.extras.unshift('superset');
      html +=
        '<li' +
        (group ? ' class="superset"' : '') +
        '><span>' +
        esc(exerciseName(row[0], custom)) +
        (sets.extras.length ? '<small class="muted">' + sets.extras.join(' · ') + '</small>' : '') +
        '</span><span class="value">' +
        sets.text +
        '</span></li>';
    });
    return html + '</ul></section>';
  }

  function customNames(c) {
    var map = {};
    (c || []).forEach(function (e) {
      map[e[0]] = e[1];
    });
    return map;
  }

  function cta(type) {
    return (
      '<section class="cta">' +
      '<a class="button" href="haltera://' +
      type +
      esc(location.hash) +
      '">Open in Haltera</a>' +
      '<p class="muted">Got Haltera? Tap to ' +
      (type === 'p' ? 'save this plan' : 'do this workout') +
      ' in the app. Haltera is coming soon to the App Store for iPhone.</p></section>'
    );
  }

  function renderPlan(data) {
    var custom = customNames(data.c);
    var weeks = data.w || [];
    var html = '';
    var title;
    if (data.k === 'd') {
      title = (weeks[0] && weeks[0][0] && weeks[0][0][0]) || 'Workout day';
      html +=
        '<div class="hero">' +
        glyph('dumbbell', 40) +
        '<h1>' +
        esc(title) +
        '</h1>' +
        '<p class="muted">A training day shared from Haltera</p></div>';
      html += dayCard(weeks[0][0], '', custom);
    } else {
      var training = 0;
      weeks.forEach(function (w) {
        w.forEach(function (d) {
          if (d[1] && d[1].length) training++;
        });
      });
      title = data.k === 'w' ? 'Weekly plan' : 'Training plan · ' + weeks.length + ' weeks';
      html +=
        '<div class="hero">' +
        glyph('dumbbell', 40) +
        '<h1>' +
        esc(title) +
        '</h1>' +
        '<p class="muted">' +
        training +
        ' training days, shared from Haltera</p></div>';
      weeks.forEach(function (w, wi) {
        if (weeks.length > 1) html += '<h3 class="week">Week ' + (wi + 1) + '</h3>';
        w.forEach(function (d, di) {
          html += dayCard(d, WEEKDAYS[di], custom);
        });
      });
    }
    document.title = title + ' · Haltera';
    return html + cta('p');
  }

  function renderResult(data) {
    var areas = data.a || [];
    var top = areas[0] && areas[0][0];
    var total =
      areas.reduce(function (s, a) {
        return s + a[1];
      }, 0) || 1;
    var date = data.t
      ? new Date(data.t).toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      : '';
    var html =
      '<div class="hero"><div class="badge">' +
      glyph(top ? AREA_ICON[top] : 'finish', 48) +
      '</div>' +
      '<h1>' +
      esc(data.n || 'Workout') +
      '</h1><p class="muted">' +
      esc(date) +
      (date ? ' · ' : '') +
      (top
        ? 'A ' + AREA_LABEL[top].toLowerCase() + ' day, done with Haltera'
        : 'Done with Haltera') +
      '</p></div>';
    html +=
      '<div class="stats">' +
      [
        ['Duration', (data.m || 0) + ' min'],
        ['Volume', num(data.kg || 0) + ' kg'],
        ['Sets', data.s || 0],
        ['Exercises', (data.x || []).length],
      ]
        .map(function (s) {
          return '<div class="stat"><b>' + esc(s[1]) + '</b><span>' + s[0] + '</span></div>';
        })
        .join('') +
      '</div>';
    if (areas.length) {
      html += '<section class="card"><h2>Trained</h2>';
      areas.forEach(function (a, i) {
        html +=
          '<div class="area' +
          (i === 0 ? ' top' : '') +
          '">' +
          glyph(AREA_ICON[a[0]], 24) +
          '<span class="label">' +
          esc(AREA_LABEL[a[0]] || a[0]) +
          '</span>' +
          '<span class="track"><span style="width:' +
          Math.max(6, Math.round((a[1] / total) * 100)) +
          '%"></span></span><span class="sets">' +
          a[1] +
          (a[1] === 1 ? ' set' : ' sets') +
          '</span></div>';
      });
      html += '</section>';
    }
    if (data.r && data.r.length) {
      html +=
        '<section class="card records"><h2>' +
        glyph('personal-record', 20) +
        'Personal records</h2><ul class="list">';
      data.r.forEach(function (r) {
        var value =
          r[1] === 'r' ? r[2] + ' reps' : num(r[2]) + ' kg' + (r[1] === 'e' ? ' e1RM' : '');
        html += '<li><span>' + esc(r[0]) + '</span><span class="value">' + value + '</span></li>';
      });
      html += '</ul></section>';
    }
    if (data.x && data.x.length) {
      html += '<section class="card"><h2>Exercises</h2><ul class="list">';
      data.x.forEach(function (e) {
        html +=
          '<li><span>' +
          esc(e[0]) +
          '</span><span class="value">' +
          e[1] +
          ' × ' +
          (e[2] > 0 ? num(e[2]) + ' kg × ' + e[3] : e[3]) +
          '</span></li>';
      });
      html += '</ul></section>';
    }
    document.title = (data.n || 'Workout') + ' · Haltera';
    return html + cta('w');
  }

  var link = window.HalteraLink.readLink(location.pathname + location.hash);
  if (!link) {
    app.innerHTML =
      '<div class="hero">' +
      glyph('dumbbell', 40) +
      '<h1>This link can’t be opened</h1>' +
      '<p class="muted">It may have been cut off when it was copied. Ask for it to be shared again.</p></div>';
    return;
  }
  try {
    app.innerHTML = link.type === 'p' ? renderPlan(link.data) : renderResult(link.data);
  } catch (e) {
    app.innerHTML = '<div class="hero"><h1>This link can’t be opened</h1></div>';
  }
})();
