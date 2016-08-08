function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function startsWith(str, prefix) {
    return str.indexOf(prefix, 0) === 0;
}

var ErrorMessage = React.createClass({
  render: function() {
    return(
      <div className="error">{this.props.message}</div>
    );
  }
});

var Content = React.createClass({
  getInitialState: function() {
    return {
      clicked: true,
    };
  },

  onClick: function(e) {
    e.preventDefault();
    this.setState({clicked: true});
  },

  highlight: function(arr) {
    var ret = [];
    var current = [];
    arr.forEach(function(t, i) {
      if (startsWith(t, "<high>") && endsWith(t, "</high>")) {
        ret.push(current.join(" "));
        current = [];

        var w = t.substring(6, t.length - 7);
        ret.push(<b key={i}> {w} </b>);
      } else {
        current.push(t);
      }
    });

    if (current.length > 0) {
      ret.push(current.join(" "));
    }

    return ret;
  },
  render: function() {
    if (this.state.clicked) {
      var rendered_content = null;
      var rendered_title = null;
      if (this.props.content.content.length > 0) {
        rendered_content = <div>Content: {this.highlight(this.props.content.content)}</div>
      }
      if (this.props.content.title.length > 0) {
        rendered_title = <div>Title: {this.highlight(this.props.content.title)}</div>
      }
      return (
        <div className="content">
          {rendered_content}
          {rendered_title}
        </div>
      );
    }

    return <a href="#" onClick={this.onClick}>[content]</a>
  },
});

var Links = React.createClass({
  getInitialState: function() {
    return {
      clicked: false,
    };
  },

  onClick: function(e) {
    e.preventDefault();
    this.setState({clicked: true});
  },

  render: function() {
    if (this.props.obj.content.links.length == 0 && this.props.obj.content.images.length == 0)
      return null;

    if (this.state.clicked) {
      var la = [];
      this.props.obj.content.links.forEach(function(l, idx) {
        la.push(<li key={"link" + idx}><a href={l} target="_blank">{l}</a></li>);
      });

      this.props.obj.content.images.forEach(function(l, idx) {
        la.push(<li key={"img" + idx}><a href={l} target="_blank"><div><img src={l} /></div><div>{l}</div></a></li>);
      });

      return <ul>Links: {la}</ul>
    }

    return <a href="#" onClick={this.onClick}>[links]</a>
  }
});

var SearchElement = React.createClass({
  render: function() {
    var obj = this.props.obj;
    var url = "http://" + obj.id;
    var author_url = "http://" + obj.author;
    var date = new Date(obj.timestamp.tsec * 1000)
    var title = obj.title;
    if (!title || title == "")
      title = url;

    return (
      <div className="searchElement">
        <p>Date: {date.toString()}, Author: <a href={author_url} target="_blank">{obj.author}</a>, Url: <a href={url} target="_blank">{title}</a>, Id: {obj.indexed_id}</p>
        <Links obj={obj} />
        <Content content={obj.content} />
      </div>
    );
  }
});

var LoadMore = React.createClass({
  onClick: function(e) {
    e.preventDefault();
    this.props.onLoadMore();
  },
  render: function() {
    return (
      <div className="loadMore">
        <a href="#" onClick={this.onClick}>{this.props.text}...</a>
      </div>
    );
  },
});

var SearchResult = React.createClass({
  render: function() {
    if (!this.props.result.ids)
      return null;

    var results = this.props.result.ids.map(function(obj, idx) {
      return <SearchElement obj={obj} key={idx} />
    });

    if (!this.props.result.completed) {
      return (
        <div className="searchResults">
          <p>Found {results.length} (load more below) in {this.props.result.mailbox}s (search query attribute: {this.props.result.description.join(" ")}):</p>
          {results}
          <LoadMore text="Load more" onLoadMore={this.props.onLoadMore} />
        </div>
      );
    } else {
      return (
        <div className="searchResults">
          <p>Search completed, these are the last results in {this.props.result.mailbox}s (search query attribute: {this.props.result.description.join(" ")}):</p>
          {results}
          <LoadMore text="Start over" onLoadMore={this.props.onStartOver} />
        </div>
      );
    }
  },
});

var SearchRequest = React.createClass({
  getInitialState: function() {
    return {
      message: '',
      next_id: '0.0',
      completed: false,
      search_result: {},
    };
  },

  onResult: function(result) {
    this.setState({
      next_id: result.next_document_id,
      completed: result.completed,
      search_result: result,
    });
  },

  onLoadMore: function() {
    this.query(this.props.query, this.state.next_id);
  },

  onStartOver: function() {
    this.setState({
      next_id: '0.0',
      completed: false,
    });

    this.query(this.props.query, 0);
  },

  query: function(query, next_id) {
    var p = {};
    p.next_document_id = next_id;
    p.max_number = 10;
    query.paging = p;

    $.ajax({
      url: this.props.search_url,
      dataType: 'json',
      type: 'POST',
      data: JSON.stringify(query),
      success: function(res) {
        res.description = [];
        for (var key in query.query) {
          if (query.query.hasOwnProperty(key)) {
            res.description.push(key);
          }
        }

        this.onResult(res);
      }.bind(this),
      error: function(xhr, status, err) {
        console.log("jquery error: xhr: %o", xhr);
        var status = xhr.status;
        if (xhr.status === 0) {
          status = -22;
        }
      }.bind(this)
    });
  },

  componentDidMount: function() {
    this.query(this.props.query, this.state.next_id);
  },

  componentWillUpdate: function(nextProps, nextState) {
    if (this.props.query != nextProps.query) {
      this.query(nextProps.query, '0.0');
    }
  },

  render: function() {
    return (
      <div className="searchRequest">
        <ErrorMessage message={this.state.message} />
        <SearchResult result={this.state.search_result} onLoadMore={this.onLoadMore} onStartOver={this.onStartOver} />
      </div>
    );
  },
});

var MainCtl = React.createClass({
  getInitialState: function() {
    return {
      requests: [],
    };
  },

  parse_query: function(text) {
    var state = {
      query: [],
      links: [],
      exact: [],
      negation: [],
    };

    state.exact = text.match(/"(.*?)"/g);
    if (!state.exact)
      state.exact = [];

    text = text.replace(/"/g, "");
    var words = text.split(" ");

    var push = function(word, prefix, dst) {
      if (startsWith(word, prefix)) {
        dst.push(word.substring(prefix.length));
        return true;
      }

      return false;
    };

    state.query = words.filter(function(word) {
      if (word.length < 1)
        return false;
      if (push(word, "-", state.negation))
        return false;
      if (push(word, "link:", state.links))
        return false;

      return true;
    });

    state.exact = state.exact.map(function(token) {
      return token.replace(/"/g,"");
    });

    return state;
  },

  query_for_attribute: function(attr, qs) {
    var ret = {};
    var q = {};
    var n = {};
    var e = {};

    e[attr] = qs.exact.join(" ");
    n[attr] = qs.negation.join(" ");
    q[attr] = qs.query.join(" ");
    if (qs.links.length > 0) {
      q["urls"] = qs.links.join(" ");
    }

    ret.query = q;
    ret.negation = n;
    ret.exact = e;
    return ret;
  },

  push_attr: function(attribute, text) {
    var qs = this.parse_query(text);

    return this.query_for_attribute(attribute, qs);
  },

  query_mbox: function(mbox, attributes, orig_query) {
    var queries = [];
    var author_match = orig_query.query.match(/ author:(\S+)/g);
    var text = null;
    if (author_match) {
      text = orig_query.query.replace(author_match[0], "");
      var author = author_match[0].split(":")[1];
      mbox = author + "." + mbox;
    } else {
      text = orig_query.query;
    }

    for (var i in attributes) {
      var attr = attributes[i];
      var q = this.push_attr(attr, text);

      q.mailbox = mbox;

      var time = {};
      time.start = orig_query.start_time;
      time.end = orig_query.end_time;

      q.time = time;

      queries.push(q);
    }

    return queries;
  },

  onSubmit: function(q) {
    if (!q.post && !q.comment)
      return;

    if (false)
    {
      var requests = this.query_mbox("post", ["fixed_title"], q);
      this.setState({requests: requests});
      return;
    }
    var requests = [];

    var post_attrs = ["fixed_title", "fixed_content"];
    var comment_attrs = ["fixed_content"];

    if (q.post) {
      requests = requests.concat(this.query_mbox("post", post_attrs, q));
    }

    if (q.comment) {
      requests = requests.concat(this.query_mbox("comment", comment_attrs, q));
    }

    this.setState({requests: requests});
  },

  render: function() {
    var requests = this.state.requests.map(function(req, idx) {
      return (
        <SearchRequest key={idx} query={req} search_url={this.props.search_url} />
      );
    }, this);

    return (
      <div>
        <SearchForm onSubmit={this.onSubmit} />
        {requests}
      </div>
    );
  }
});

var search_url = "http://odin.reverbrain.com:8111/search";

ReactDOM.render(
  <MainCtl
    search_url={search_url}
  />,
  document.getElementById('main')
);
