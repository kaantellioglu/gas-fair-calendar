(() => {
  const nextDay = value => {
    const date = new Date(value + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  };
  const escapeCal = value => String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, '\\$&');
  function fold(line) {
    const encoder = new TextEncoder();
    let result = '', size = 0;
    for (const char of line) {
      const bytes = encoder.encode(char).length;
      if (size + bytes > 75) {
        result += '\r\n ';
        size = 1;
      }
      result += char;
      size += bytes;
    }
    return result;
  }
  function calendar(events, checked) {
    const stamp = checked.replaceAll('-', '') + 'T000000Z';
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Gaz Takvimi//2027//TR','CALSCALE:GREGORIAN','X-WR-CALNAME:Gaz Takvimi 2027'];
    for (const event of events.filter(item => item.start)) {
      const description = [event.status, event.registration, event.note, event.source].filter(Boolean).join('\n');
      lines.push('BEGIN:VEVENT','UID:' + event.id + '-2027@gaz-takvimi','DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + event.start.replaceAll('-', ''),'DTEND;VALUE=DATE:' + nextDay(event.end).replaceAll('-', ''),
        'SUMMARY:' + escapeCal(event.name),'LOCATION:' + escapeCal([event.venue,event.city,event.country].filter(Boolean).join(', ')),
        'URL:' + event.website,'DESCRIPTION:' + escapeCal(description),
        'STATUS:' + (event.status === 'Birincil kaynak' ? 'CONFIRMED' : 'TENTATIVE'),'END:VEVENT');
    }
    return lines.concat('END:VCALENDAR').map(fold).join('\r\n') + '\r\n';
  }
  const fields = {id:'Kimlik',name:'Etkinlik',topic:'Konu',type:'Tür',country:'Ülke',city:'Şehir',venue:'Mekân',start:'Başlangıç',end:'Bitiş',visitor:'Ziyaretçi ücreti',delegate:'Delege ücreti',attendance:'Katılım',website:'Web sitesi',registration:'Kayıt bağlantısı',source:'Tarih ve bilgi kaynağı',feeSource:'Ücret kaynağı',status:'Tarih kaynağı türü',note:'Not',checked:'Son inceleme'};
  function csv(events) {
    const cell = value => {
      let text = String(value ?? '');
      if (/^\s*[=+\-@\t\r\n]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"','""') + '"';
    };
    return '\ufeff' + [Object.values(fields), ...events.map(event => Object.keys(fields).map(key => event[key]))]
      .map(row => row.map(cell).join(';')).join('\r\n') + '\r\n';
  }
  const group = (events, key) => Object.fromEntries(Array.from(new Set(events.map(key))).sort().map(value => [value, events.filter(event => key(event) === value).length]));
  function report(events) {
    return {
      total: events.length,
      countries: new Set(events.map(e => e.country).filter(Boolean)).size,
      primary: events.filter(e => e.status === 'Birincil kaynak').length,
      registrations: events.filter(e => e.registration).length,
      priced: events.filter(e => e.visitor || e.delegate).length,
      missingVisitPrice: events.filter(e => !e.visitor).length,
      missingDelegatePrice: events.filter(e => !e.delegate).length,
      undated: events.filter(e => !e.start).length,
      byMonth: group(events.filter(e => e.start), e => e.start.slice(5,7)),
      byTopic: group(events, e => e.topic),
      byCountry: group(events, e => e.country),
      byStatus: group(events, e => e.status)
    };
  }
  const api = {calendar,csv,report};
  if (typeof module !== 'undefined') module.exports = api;
  else window.GazCore = api;
})();
