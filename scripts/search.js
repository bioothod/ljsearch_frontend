var Info = React.createClass({
  onLinkClick: function(e) {
    e.preventDefault();
    this.props.onLinkClick(e.target.text);
  },
  onQueryClick: function(e) {
    e.preventDefault();
    this.props.onQueryClick(e.target.text);
  },
  onAuthorClick: function(e) {
    e.preventDefault();
    this.props.onAuthorClick(e.target.text);
  },

  render: function() {
    if (!this.props.active)
      return null;

    return (
      <div>
        <p>Implementation details:</p>
        <ul>
          <li>Search is performed over stemmed content, spell checking is not yet supported, but indexed content includes both stemmed and original versions of the posts and comments.</li>
          <li>Search only supports AND operator, i.e. documents returned are guaranteed to contain all search query elements. Exact match is not yet supported.</li>
          <li>Link searching form can include both url format like [<a href="" onClick={this.onLinkClick}>www.gazeta.ru</a>] or just [<a href="" onClick={this.onLinkClick}>jpg</a>], returned documents match both text query and have required link elements in 'a' or 'img' tags.</li>
          <li>Author search like [<a href="" onClick={this.onAuthorClick}>drugoi.livejournal.com</a>] limits results to given author only, but please note that original database does not always have author field for content. If author is not specified, search is being performed against the whole database.</li>
          <li>There are no exceptions for stop words like [<a href="" onClick={this.onQueryClick}>to be or not to be</a>] or short terms like [<a href="" onClick={this.onQueryClick}>i</a>], everything is indexed and being quickly searched.</li>
          <li>Very small disk footprint, this test content is about 200Mb uncompressed (200k livejournal posts and comments), it takes about 450Mb on disk, including original content and general and per-author indexes.</li>
        </ul>
        <p>TODO list:</p>
        <ul>
          <li>Exact phrase search</li>
          <li>Spell checking and error correction</li>
          <li>Negation support</li>
          <li>Date/Time search support</li>
          <li>Pagination support, please note that plain [Путин] request will send about 5Mb of data to client</li>
        </ul>
      </div>
    );
  }
});

window.SearchForm = React.createClass({
  getInitialState: function() {
    return {
      query: 'Путин',
      author: '',
      links: '',
      post: true,
      comment: true,
      info_active: true,
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

  onLinkClick: function(text) {
    this.setState({links: text});
  },
  onQueryClick: function(text) {
    this.setState({query: text});
  },
  onAuthorClick: function(text) {
    this.setState({author: text});
  },

  handleSubmit: function(e) {
    this.setState({info_active: false});

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
      <div className="searchWrapper">
        <form className="searchForm" onSubmit={this.handleSubmit}>
          <div className="query">Search query: <input type="text" placeholder="Путин" value={this.state.query} onChange={this.handleQueryChange}/></div>
          <div className="author">Search for embedded links containing given elements: <input type="text" placeholder="www.gazeta.ru" value={this.state.links} onChange={this.handleLinksChange}/></div>
          <div className="author">Search only for this author: <input type="text" placeholder="xxx.livejournal.com" value={this.state.author} onChange={this.handleAuthorChange}/></div>
          <div className="checkbox"><input type="checkbox" defaultChecked={true} onChange={this.handlePostCheckboxChange} />Search in posts</div>
          <div className="checkbox"><input type="checkbox" defaultChecked={true} onChange={this.handleCommentCheckboxChange} />Search in comments</div>
          <input type="submit" value="Post" />
        </form>
        <Info active={this.state.info_active} onLinkClick={this.onLinkClick} onAuthorClick={this.onAuthorClick} onQueryClick={this.onQueryClick}/>
      </div>
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
