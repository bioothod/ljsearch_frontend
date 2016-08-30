var Info = React.createClass({
  onQueryClick: function(e) {
    e.preventDefault();
    this.props.onQueryClick(e.target.text);
  },

  render: function() {
    if (!this.props.active)
      return null;

    return (
      <div>
        <p>Implementation details:</p>
        <ul>
          <li>Search is performed over stemmed content, spell checking is not yet supported, but indexed content includes both stemmed and original versions of the posts and comments.</li>
          <li>Search only supports AND operator, i.e. documents returned are guaranteed to contain all search query elements.</li>
          <li>Link searching can include both url format like [<a href="" onClick={this.onQueryClick}>link:www.gazeta.ru</a>] or just [<a href="" onClick={this.onQueryClick}>link:jpg</a>], returned documents match both text query and have required link elements in 'a' or 'img' tags.</li>
          <li>Author search like [<a href="" onClick={this.onQueryClick}>author:drugoi.livejournal.com</a>] limits results to given author only, but please note that original database does not always have author field for content. If author is not specified, search is being performed against the whole database.</li>
          <li>Journal search like [<a href="" onClick={this.onQueryClick}>journal:drugoi.livejournal.com</a>] limits results to given journal (posts and comments) only. If author is also specified, search is being performed against all comments given author made in this journal. If it is the author of the journal, all posts and comments will be checked.</li>
          <li>There are no exceptions for stop words like [<a href="" onClick={this.onQueryClick}>to be or not to be</a>] or short terms like [<a href="" onClick={this.onQueryClick}>i</a>], everything is indexed and being quickly searched.</li>
          <li>Very small disk footprint, this test content is about 200Mb uncompressed (200k livejournal posts and comments), it takes about 450Mb on disk, including original content and general and per-author indexes.</li>
          <li>Per request type pagination support, there are 3 request types: post content and title and comment content. Pagination allows to read next set of search results for particular type without reloading others.</li>
          <li>Exact phrase search - use double quotes [<a href="" onClick={this.onQueryClick}>"поездка Путина"</a>] to find out exact match, please note that stemming is not used in exact match, i.e. ["testing"] is not equal to ["test"] which would yield the same results if used without quotes.</li>
          <li>Negation support - use 'minus' symbol [<a href="" onClick={this.onQueryClick}>-rafale</a>] to exclude documents which contain given word.</li>
          <li>Date/Time search support, returned documents are sorted in ascending order, there are input controls to specify start/end time range for documents, format is YYYY-MM-DD.</li>
        </ul>
        <p>TODO list:</p>
        <ul>
          <li>Spell checking and error correction</li>
        </ul>
      </div>
    );
  }
});

window.SearchForm = React.createClass({
  getInitialState: function() {
    return {
      start_time: Date.parse("2001-01-01"),
      end_time: Date.now(),
      query: '',
      post: true,
      comment: true,
      info_active: true,
    }
  },

  handleQueryChange: function(e) {
    this.setState({query: e.target.value});
  },
  handlePostCheckboxChange: function(e) {
    this.setState({post: e.target.checked});
  },
  handleCommentCheckboxChange: function(e) {
    this.setState({comment: e.target.checked});
  },

  onQueryClick: function(text) {
    this.setState({query: text});
  },

  onStartDateChange: function(e) {
    var v = Date.parse(e.target.value);
    if (v) {
      this.setState({start_time: v});
    }
  },
  onEndDateChange: function(e) {
    var v = Date.parse(e.target.value);
    if (v) {
      this.setState({end_time: v});
    }
  },

  handleSubmit: function(e) {
    e.preventDefault();
    var query = this.state.query.trim();
    if (!query) {
      return;
    }

    this.props.onSubmit({
      query: query,
      post: this.state.post,
      comment: this.state.comment,
      start_time: Math.round(this.state.start_time / 1000),
      end_time: Math.round(this.state.end_time / 1000 + 24*3600),
      info_active: false,
    });
  },
  render: function() {
    return (
      <div className="searchWrapper">
        <form className="searchForm" onSubmit={this.handleSubmit}>
          <div className="queryLine">
          <input id="submit" type="submit" value="Post" />
          <div className="query"><input type="text" placeholder="Livejournal archive search..." value={this.state.query} onChange={this.handleQueryChange}/></div>
          </div>
          <div className="date">Limit search to this time range: <input type="text" name="start_date" defaultValue={this.state.start_time.toString("yyyy-MM-dd")} onChange={this.onStartDateChange}/> - <input type="text" name="end_data" defaultValue={this.state.end_time.toString("yyyy-MM-dd")} onChange={this.onEndDateChange}/></div>
          <div className="checkbox"><input type="checkbox" defaultChecked={true} onChange={this.handlePostCheckboxChange} />Search in posts</div>
          <div className="checkbox"><input type="checkbox" defaultChecked={true} onChange={this.handleCommentCheckboxChange} />Search in comments</div>
        </form>
        <Info active={this.state.info_active} onQueryClick={this.onQueryClick}/>
      </div>
    );
  }
});
