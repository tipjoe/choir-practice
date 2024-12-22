document.addEventListener("alpine:init", async (e) => {
  // Add v timestamp, combined with html's Cache-Control, to always get latest.
  const res = await fetch("./assets/data/songs.json?v=" + new Date().getTime());
  let songs = (await res.json()).songs.sort((a, b) => {
    // Turn due into dates.
    const aDue = new Date(a.due);
    const bDue = new Date(b.due);
    // If due dates are the same, sort by title.
    if (aDue === bDue) {
      return a.title.localeCompare(b.title);
    }
    return aDue - bDue;
  });

  // Dorky Abba photos to make people laugh.
  const abbaGifs = [
    "https://www.bing.com/th/id/OGC.57a6b9a129c3b97a74fbda525fd11e92?pid=1.7&rurl=https%3a%2f%2fmedia0.giphy.com%2fmedia%2fXZBOjxULCOFDtLIJ3v%2fgiphy.gif&ehk=y65b2CNAmKGN6hEv4MuhUFSHIIgCejTCjk2fS4%2f7uMA%3d",
    "https://www.bing.com/th/id/OGC.002075143d3ad8efc3db65bf2d45dc8c?pid=1.7&rurl=https%3a%2f%2fmedia.tenor.com%2fC0BoV0aQKScAAAAd%2fabba-take-a-chance-on-me.gif&ehk=YuGHX%2b0X76jL1ROu%2bxtqfP44Tt2H0uRvs8iyGrw4pQM%3d",
    "https://www.bing.com/th/id/OGC.c670724fd17ca95cadaf9783b8b806bc?pid=1.7&rurl=https%3a%2f%2fmedia3.giphy.com%2fmedia%2f5QYfn1B41MP3N0wCGi%2fgiphy.gif%3fcid%3d790b7611c04380e9dc62540d9f0c683552088dcae6411c20%26rid%3dgiphy.gif%26ct%3dg&ehk=NvlUZE5HgiVA2etyJUa2pL4uaRVm3A7XuSqGFhJAFK4%3d",
    "https://www.bing.com/th/id/OGC.a7ca08cebbd9ad9d477ae271019a2bd3?pid=1.7&rurl=https%3a%2f%2fmedia4.giphy.com%2fmedia%2f3mmcb0odnpVvHrjfzk%2fgiphy.gif%3fcid%3d790b7611b3ab21997988625755373822987cd63fd21be070%26rid%3dgiphy.gif%26ct%3dg&ehk=Sld77OvXtkRfS8H93ujWY73OkRmMQ%2bx90yiRzcy7s%2bs%3d",
  ];

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
    // Since songsTmp was in localStorage, ensure we any tracking values and
    // and add tracking to any new songs.
    songs = songs.map((song, index) => {
      if (song.id === songsTmp[index].id) {
        // Use latest from songs file, but override tracking.
        return {
          ...song,
          count: songsTmp[index].count,
          getIt: songsTmp[index].getIt,
          giveIt: songsTmp[index].giveIt,
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
    abbaGifs,
    getAbbaGif() {
      const randomIndex = Math.floor(Math.random() * this.abbaGifs.length);
      return this.abbaGifs[randomIndex];
    },
    // Track new listens for a song.
    incrementListenCount(e) {
      // Get ID from incButtonX and ensure it's an int.
      const id = parseInt(e.target.id.slice(9));
      this.songs = this.songs.map((song) => {
        if (song.id === id) {
          return {
            ...song,
            count: song.count + 1,
          };
        }
        return song;
      });

      // Back it up in localStorage por favorage.
      localStorage.setItem("songs", JSON.stringify(this.songs));
    },

    // Get current songs.
    getSongs() {
      return this.songs.filter((song) => {
        const due = new Date(song.due).getTime();
        const now = new Date().getTime();
        if (due >= now) {
          return song;
        }
      });
    },
    // Get past songs.
    getPastSongs() {
      return this.songs.filter((song) => {
        const due = new Date(song.due).getTime();
        const now = new Date().getTime();
        if (due < now) {
          return song;
        }
      });
    },

    // Get listen count for a song.
    getListenCountById(id) {
      const song = this.songs.find((song) => song.id === id);
      return song.count;
    },

    // Mark songs you know or resume practice.
    toggleGotIt(id) {
      this.songs = this.songs.map((song) => {
        if (song.id === id) {
          if (!song.gotIt) {
            return {
              ...song,
              gotIt: true,
            };
          } else if (!song.giveIt) {
            return {
              ...song,
              giveIt: true,
            };
          }
        }
        return song;
      });

      // Back it up in localStorage por favorage.
      localStorage.setItem("songs", JSON.stringify(this.songs));
    },
    gotItLabel(id) {
      const song = this.songs.find((song) => song.id === id);
      if (song.giveIt) {
        return "Good!";
      } else if (song.gotIt) {
        return "Give It!";
      } else {
        return "Got It!";
      }
    },
    // Provide the daysFromNow class for styling. If "gotIt" is true, override.
    daysFromNowClass(id) {
      // First see if singer has already "gotIt".
      const song = this.songs.find((song) => song.id === id);
      if (song.giveIt) {
        return "song-give-it";
      } else if (song.gotIt) {
        return "song-got-it";
      } else {
        const days = daysFromNow(new Date(song.due));
        if (days < 0) {
          return "song-overdue";
        } else if (days > 20) {
          return "song-have-time";
        } else {
          return "song-soon";
        }
      }
    },
    isGood(id) {
      const song = this.songs.find((song) => song.id === id);
      // If this is true, we're "good".
      return !!song.giveIt;
    },
  });
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
  // const date1Ms = new Date(date1).getTime();
  // const date2Ms = new Date(date2).getTime();

  // Calculate the difference in milliseconds
  const diff = due - now;
  // Calculate the days away.
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  // Convert back to days and return
  return days;
}

function toggleHowDetails() {
  let el = document.getElementById("how-details");
  if (el.style.display !== "block") {
    el.style.display = "block";
  } else {
    el.style.display = "none";
  }
}
