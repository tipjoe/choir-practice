document.addEventListener("alpine:init", async (e) => {
  // Add v timestamp, combined with html's Cache-Control, to always get latest.

  // Chancel Choir
  let res;
  if (location.pathname.includes('gospel')) {
    // Gospel Choir
    res = await fetch("../assets/data/songs-gospel.json?v=" + new Date().getTime());
  } else {
    res = await fetch("./assets/data/songs.json?v=" + new Date().getTime());
  }

  let songs = (await res.json()).songs.sort((a, b) => {
    // Turn due into dates.
    const aDue = new Date(a.due);
    const bDue = new Date(b.due);
    // If due date timestamps are the same, sort by title.
    if (aDue.getTime() === bDue.getTime()) {
      return a.title.localeCompare(b.title);
    }
    return aDue - bDue;
  });

  // Initialize songsTmp from localStorage to compare with songs.
  const songsTmp = JSON.parse(localStorage.getItem("songs")) || [];

  // If none exist, initialize all to 0.
  if (!songsTmp.length) {
    // Add tracking props as needed.
    songs = songs.map((song) => {
      return {
        ...song,
        count: 0,
        gotIt: false,
        giveIt: false,
      };
    });
    localStorage.setItem("songs", JSON.stringify(songs));
  } else {
    // Since songsTmp was in localStorage, ensure retain tracking values and
    // and add tracking to any new songs.
    songs = songs.map((song, index) => {
      if (songsTmp[index] && song.id === songsTmp[index].id) {
        // Use latest from songs file, but override tracking.
        return {
          ...song,
          count: songsTmp[index].count,
          gotIt: songsTmp[index].gotIt,
          giveIt: songsTmp[index].giveIt
        };
      } else {
        return {
          ...song,
          count: 0,
          gotIt: false,
          giveIt: false,
        };
      }
    });
    localStorage.setItem("songs", JSON.stringify(songs));
  }

  // The 'choir' store.
  Alpine.store("choir", {
    songs,

    // Get current songs.
    // Add one day of milliseconds so the song doesn't "expire" till end of day.
    getSongs() {
      return this.songs.filter((song) => {
        const due = new Date(song.due).getTime() + 86400000;
        const now = new Date().getTime();
        if (due >= now) {
          return song;
        }
      });
    },
    // Get past songs.
    // Add one day of milliseconds so the song doesn't "expire" till end of day.
    getPastSongs() {
      return this.songs.filter((song) => {
        const due = new Date(song.due).getTime() + 86400000;
        const now = new Date().getTime();
        if (song.id == 22) {
          console.log('due, now', due - now);

        }
        if (due < now) {
          return song;
        }
      }).sort((a, b) => {
        // Sort descending to show most recent first.
        // Turn due into dates.
        const aDue = new Date(a.due);
        const bDue = new Date(b.due);
        // If due date timestamps are the same, sort by title.
        if (aDue.getTime() === bDue.getTime()) {
          return a.title.localeCompare(b.title);
        }
        return bDue - aDue;
      })
    },

    // Provide the daysFromNow class for styling. If "gotIt" is true, override.
    daysFromNowClass(id) {
      // First see if singer has already "gotIt".
      const song = this.songs.find((song) => song.id === id);
      // if (song.giveIt) {
      //   return "song-give-it";
      // } else if (song.gotIt) {
      //   return "song-got-it";
      // } else {
      const days = daysFromNow(new Date(song.due));
      if (days < 0) {
        return "song-overdue";
      } else if (days > 999) {
        return "song-unscheduled";
      } else if (days > 14) {
        return "song-have-time";
      } else {
        return "song-soon";
      }
      // }
    },
    // Ignore this for now.
    isGood(id) {
      const song = this.songs.find((song) => song.id === id);
      // If this is true, we're "good".
      // return !!song.giveIt;
      // return !!song.giveIt;
    },
  });

  // Make #songN hash URLs work. Needs a timeout. Bumped to 750 because it
  // seems to be longer if the page isn't already loaded/cached once.
  const myHash = location.hash.slice(1);
  if (myHash) { // songX
    setTimeout(function() {
      const myHashEl = document.getElementById(myHash);
      if (myHashEl) {
        document.getElementById(myHash).scrollIntoView();
      }
    }, 750);
  }
});

function formatDate(date) {
  return (
    String(date.getMonth() + 1) +
    "/" +
    String(date.getDate()) +
    "/" +
    String(date.getFullYear()).slice(2)
  );
}

function daysFromNow(date) {
  const now = new Date().getTime();
  const due = date.getTime();

  // Calculate the difference in milliseconds
  const diff = due - now;
  // Calculate the days away.
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  // Convert back to days and return
  return days;
}
