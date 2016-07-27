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
  },
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

    for (var i in this.props.results) {
      var res = this.props.results[i];

      var mbox = null;
      if (res.mailbox == "post") {
        mbox = posts;
      }
      if (res.mailbox == "comment") {
        mbox = comments;
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
    if (comments.length !== 0) {
      comment_results = 
        <div className="searchComments">
          <p>Found {comments.length} in comments:</p>
          {comments}
        </div>
    }
    
    var post_results = null;
    if (posts.length !== 0) {
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
