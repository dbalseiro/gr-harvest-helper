function GRlog(text) {
  console.log('[GR-Time-Tracker]: ' + text);
}

function detectJira() {
  const appName = document.querySelector('[name=application-name]');
  return appName && appName.content === 'JIRA';
}

function detectZammad() {
  return (
    document && document.getElementsByClassName('ticket-title-update js-objectTitle').length > 0
  );
}

function detectGitlab() {
  return (
    document &&
    document.getElementsByClassName('detail-page-header-actions js-issuable-actions').length > 0
  );
}

function detectGithub() {
  return document && document.getElementsByClassName('js-issue-title').length > 0;
}

function detectNotion() {
  const html = document.getElementsByTagName("html");
  if (html[0].className === "notion-html") {
    console.log("html found");
    const header = document.getElementsByTagName("header")[0];
    const arrayOf = elem => Array.from(header.getElementsByTagName(elem));
    const spans = arrayOf("span").concat(arrayOf("div"))
    for (i in spans) {
      if (spans[i].innerText === "Kanban board") {
        return true;
      }
    }
  }
  return false;
}

async function jiraGetIssueTitle() {
  let issueId;
  let issueIdMatches = document.title.match(/\[(.*?)]/);

  if (issueIdMatches) {
    issueId = issueIdMatches[1];
  } else {
    // fallback to get issue id from the url
    const urlParams = new URLSearchParams(window.location.search);
    issueId = urlParams.get('selectedIssue');
  }

  if (!issueId) return '';

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const issueTitle = await fetch(protocol + '//' + hostname + '/rest/api/2/issue/' + issueId, {
    headers: { 'Content-Type': 'application/json' },
  })
    .then((response) => response.json())
    .then((data) => {
      return data.fields.summary;
    });
  return {
    id: issueId,
    title: `${issueId}: ${issueTitle}`,
  };
}

function zammadGetIssueTitle() {
  var title = document.getElementsByClassName('ticket-title-update js-objectTitle')[0].textContent;
  return {
    title: title,
  };
}

function gitlabGetIssueTitle() {
  var taskName = document.getElementsByClassName('title qa-title')[0].textContent;
  var taskId = document.getElementsByClassName('breadcrumbs-sub-title')[0].textContent;
  var title = taskName + '(' + taskId + ')';
  return {
    id: taskId,
    title: title,
  };
}

function githubGetIssueTitle() {
  var taskName = document.getElementsByClassName('js-issue-title')[0].textContent.trim();
  var taskId = document.getElementsByName('issue')[0].value;
  var title = `#${taskId}: ${taskName}`;
  return {
    id: taskId,
    title: title,
  };
}

function notionGetIssueTitle() {
  var divs = document.getElementsByTagName("div");
  var taskId;
  for (i in divs) {
    var possibleId = divs[i].innerText;
    if (possibleId.startsWith("ENG-")) {
      taskId = possibleId;
      break;
    }
  }
  var titles = document.getElementsByTagName("h1");
  var taskName = titles[titles.length - 1].innerText;
  var title = `[${taskId}]: ${taskName}`;
  return {
    id: taskId,
    title: title,
  };
}

if (detectJira()) {
  GRlog('jira detected');
  jiraGetIssueTitle().then((res) => {
    chrome.runtime.sendMessage(res);
  });
} else if (detectZammad()) {
  GRlog('zammad detected');
  chrome.runtime.sendMessage(zammadGetIssueTitle());
} else if (detectGitlab()) {
  GRlog('gitlab detected');
  chrome.runtime.sendMessage(gitlabGetIssueTitle());
} else if (detectGithub()) {
  GRlog('github detected');
  chrome.runtime.sendMessage(githubGetIssueTitle());
} else if (detectNotion()) {
  chrome.runtime.sendMessage(notionGetIssueTitle());
  GRlog('notion detected');
}
