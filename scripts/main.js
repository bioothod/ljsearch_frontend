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
        <p>Date: {date.toString()}, Author: <a href={author_url} target="_blank">{obj.author}</a>, Url: <a href={url} target="_blank">{title}</a></p>
        <Links obj={obj} />
        <Content content={obj.content} />
      </div>
    );
  }
});

var SearchResults = React.createClass({
  render: function() {
    if (!this.props.results)
      return null;

    var comments = [];
    var posts = [];

    var want_comments = false;
    var want_posts = false;

    for (var i in this.props.results) {
      var res = this.props.results[i];

      var mbox = null;
      if (res.mailbox == "post") {
        mbox = posts;
        want_posts = true;
      }
      if (res.mailbox == "comment") {
        mbox = comments;
        want_comments = true;
      }

      if (!mbox)
        continue;

      for (var j in res.ids) {
        var obj = res.ids[j];
        var elm = <SearchElement obj={obj} key={res.mailbox + res.attribute + obj.id + obj.timestamp.tsec} />
        mbox.push(elm);
      }
    }

    var comment_results = null;
    if (want_comments) {
      comment_results = 
        <div className="searchComments">
          <p>Found {comments.length} in comments:</p>
          {comments}
        </div>
    }
    
    var post_results = null;
    if (want_posts) {
      post_results = 
        <div className="searchPosts">
          <p>Found {posts.length} in posts:</p>
          {posts}
        </div>
    }

    return (
      <div className="searchResults">
        {comment_results}
        {post_results}
      </div>
    );
  },
});

var MainCtl = React.createClass({
  getInitialState: function() {
    return {
      message: '',
      search_results: [],
    };
  },

  onInit: function() {
    this.setState(this.getInitialState());
  },

  onResult: function(result) {
    var res = this.state.search_results;
    var nres = res.concat([result]);
    this.setState({
      search_results: nres,
    });
  },

  render: function() {
    return (
      <div>
        <Search onInit={this.onInit} onResult={this.onResult} search_url={this.props.search_url} />
        <ErrorMessage message={this.state.message} />
        <SearchResults results={this.state.search_results} />
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
