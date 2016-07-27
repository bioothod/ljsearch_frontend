window.SearchForm = React.createClass({
  getInitialState: function() {
    return {
      query: 'Путин',
      author: '',
      links: '',
      post: true,
      comment: true,
    }
  },

  handleQueryChange: function(e) {
    this.setState({query: e.target.value});
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleLinksChange: function(e) {
    this.setState({links: e.target.value});
  },
  handlePostCheckboxChange: function(e) {
    this.setState({post: e.target.checked});
  },
  handleCommentCheckboxChange: function(e) {
    this.setState({comment: e.target.checked});
  },

  handleSubmit: function(e) {
    e.preventDefault();
    var query = this.state.query.trim();
    var author = this.state.author.trim();
    var links = this.state.links.trim();
    if (!query && !links) {
      return;
    }

    this.props.onSubmit({
      query: query,
      author: author,
      links: links,
      post: this.state.post,
      comment: this.state.comment,
    });
  },
  render: function() {
    return (
      <form className="searchForm" onSubmit={this.handleSubmit}>
        <div className="query">Search query: <input type="text" placeholder="Путин" value={this.state.query} onChange={this.handleQueryChange}/></div>
        <div className="author">Search for embedded links containing given elements: <input type="text" placeholder="www.gazeta.ru" value={this.state.links} onChange={this.handleLinksChange}/></div>
        <div className="author">Search only for this author: <input type="text" placeholder="xxx.livejournal.com" value={this.state.author} onChange={this.handleAuthorChange}/></div>
        <div className="checkbox"><input type="checkbox" defaultChecked={true} onChange={this.handlePostCheckboxChange} />Search in posts</div>
        <div className="checkbox"><input type="checkbox" defaultChecked={true} onChange={this.handleCommentCheckboxChange} />Search in comments</div>
        <input type="submit" value="Post" />
      </form>
    );
  }
});

window.Search = React.createClass({
  push_attr: function(attribute, author, text, links) {
    var query = {};

    if (text && text != "") {
      if (author && author != "") {
        query[author + "." + attribute] = text;
      } else {
        query[attribute] = text;
      }
    }

    if (links && links != "") {
      if (author && author != "") {
        query[author + "." + "urls"] = links;
      } else {
        query["urls"] = links;
      }
    }

    return query;
  },

  query: function(mbox, attribute, author, text, links) {
    var query = {};
    query.mailbox = mbox;
    query.query = this.push_attr(attribute, author, text, links);

    $.ajax({
      url: this.props.search_url,
      dataType: 'json',
      type: 'POST',
      data: JSON.stringify(query),
      success: function(data) {
        data.attribute = attribute;
        data.author = author;
        data.links = links;
        data.query = text.split(" ");

        this.props.onResult(data);
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
  query_mbox: function(mbox, attributes, author, text, links) {
    for (var i in attributes) {
      this.query(mbox, attributes[i], author, text, links);
    }
  },
  onSubmit: function(q) {
    if (!q.post && !q.comment)
      return;

    this.props.onInit();

    var post_attrs = ["fixed_title", "fixed_content"];
    var comment_attrs = ["fixed_content"];

    if (q.post) {
      this.query_mbox("post", post_attrs, q.author, q.query, q.links);
    }

    if (q.comment) {
      this.query_mbox("comment", comment_attrs, q.author, q.query, q.links);
    }
  },

  render: function() {
    return (
      <SearchForm onSubmit={this.onSubmit} />
    );
  }
});
