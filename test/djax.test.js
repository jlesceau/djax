import assert from 'assert';

const baseUrl = 'http://localhost:8001';

export default (ajax, ajaxName) => {
  describe(`Polymorphism (${ ajaxName })`, () => {
    it('should work without any callback.', done => {
      ajax({ url: baseUrl + '/data/1' });

      setTimeout(done, 200);
    });

    it('should work as ajax().then(success)', done => {
      ajax({
        url: baseUrl + '/data/1',
        error: () => {
          throw new Error('Unexpected error.');
        },
      }).then((data, textStatus, ...rest) => {
        assert.deepEqual(data.result, { data: 'abcde', id: '1' });
        assert.equal(textStatus, 'success');
        // rest contains xhr, unused here
        assert.equal(rest.length, 1);
        done();
      });
    });

    it('should work as ajax({ url, success, error })', done => {
      const res = ajax({
        url: baseUrl + '/data/1',
        success: (data, textStatus, xhr, ...rest) => {
          assert.deepEqual(data.result, { data: 'abcde', id: '1' });
          assert.equal(textStatus, 'success');
          assert.equal(xhr, res);
          assert.equal(rest.length, 0);
          done();
        },
        error: () => {
          throw new Error('Unexpected error.');
        },
      });
    });

    it('should work as ajax(url).then(success, error)', done => {
      const res = ajax(baseUrl + '/data/1');
      res.then(
          (data, textStatus, xhr, ...rest) => {
            assert.deepEqual(data.result, { data: 'abcde', id: '1' });
            assert.equal(textStatus, 'success');
            assert.equal(xhr, res);
            assert.equal(rest.length, 0);
            done();
          },
          () => {
            throw new Error('Unexpected error.');
          }
        );
    });

    it('should work as ajax(url).done(success).fail(error)', done => {
      const res = ajax(baseUrl + '/data/1')
        .done(
          (data, textStatus, xhr, ...rest) => {
            assert.deepEqual(data.result, { data: 'abcde', id: '1' });
            assert.equal(textStatus, 'success');
            assert.equal(xhr, res);
            assert.equal(rest.length, 0);
            done();
          }
        )
        .fail(() => {
          throw new Error('Unexpected error.');
        });
    });

    it('should work as ajax(url).fail(error).done(success)', done => {
      const res = ajax(baseUrl + '/data/1')
        .fail(() => {
          throw new Error('Unexpected error.');
        })
        .done(
          (data, textStatus, xhr, ...rest) => {
            assert.deepEqual(data.result, { data: 'abcde', id: '1' });
            assert.equal(textStatus, 'success');
            assert.equal(xhr, res);
            assert.equal(rest.length, 0);
            done();
          }
        );
    });

    it('should work with res.done called after success', done => {
      const res = ajax(baseUrl + '/data/1')
        .fail(() => {
          throw new Error('Unexpected error.');
        })
        .done(
          () => res.done((data, textStatus, xhr, ...rest) => {
            assert.deepEqual(data.result, { data: 'abcde', id: '1' });
            assert.equal(textStatus, 'success');
            assert.equal(xhr, res);
            assert.equal(rest.length, 0);
            done();
          })
        );
    });
  });

  describe(`HTTP verbs (${ ajaxName })`, () => {
    it('should work with GET calls', done => {
      const res = ajax({
        url: baseUrl + '/data/1',
        success: (data, textStatus, xhr, ...rest) => {
          assert.deepEqual(data.result, { data: 'abcde', id: '1' });
          assert.equal(textStatus, 'success');
          assert.equal(xhr, res);
          assert.equal(rest.length, 0);
          done();
        },
        error: () => {
          throw new Error('Unexpected error.');
        },
      });
    });

    it('should work with POST calls', done => {
      const res = ajax({
        url: baseUrl + '/data/1',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          data: 'DEFGH',
        }),
        success: (data, textStatus, xhr, ...rest) => {
          assert.deepEqual(data.result, { data: 'DEFGH', id: '1' });
          assert.equal(textStatus, 'success');
          assert.equal(xhr, res);
          assert.equal(rest.length, 0);
          done();
        },
        error: () => {
          throw new Error('Unexpected error.');
        },
      });
    });

    it('should work with PUT calls', done => {
      const res = ajax({
        url: baseUrl + '/data/',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
          data: 'First entry',
        }),
        success: (data, textStatus, xhr, ...rest) => {
          assert.deepEqual(data.result, { data: 'First entry', id: '3' });
          assert.equal(textStatus, 'success');
          assert.equal(xhr, res);
          assert.equal(rest.length, 0);
          done();
        },
        error: () => {
          throw new Error('Unexpected error.');
        },
      });
    });

    it('should work with DELETE calls', done => {
      const res = ajax({
        url: baseUrl + '/data/2',
        type: 'DELETE',
        success: (data, textStatus, xhr, ...rest) => {
          assert.deepEqual(data, { ok: true });
          assert.equal(textStatus, 'success');
          assert.equal(xhr, res);
          assert.equal(rest.length, 0);
          done();
        },
        error: () => {
          throw new Error('Unexpected error.');
        },
      });
    });

    it('should trigger the error callback when status is 400', done => {
      const res = ajax({
        url: baseUrl + '/data/inexisting_id',
        type: 'POST',
        success: () => {
          throw new Error('Unexpected success.');
        },
        error: (xhr, textStatus, errorThrown, ...rest) => {
          assert.deepEqual(xhr, res);
          assert.equal(textStatus, 'error');
          // TODO
          // Find why jQuery receives here "Bad Request" while djax
          // receives "Bad request"...
          // assert.equal(errorThrown, 'Bad request');
          assert.equal(errorThrown.toLowerCase(), 'bad request');
          assert.equal(rest.length, 0);
          done();
        },
      });
    });

    it('should work with GET calls and empty data', done => {
      const res = ajax({
        url: baseUrl + '/adhoc/',
        success: (data, textStatus, xhr, ...rest) => {
          assert.equal(data, '');
          assert.equal(textStatus, 'success');
          assert.equal(xhr, res);
          assert.equal(rest.length, 0);
          done();
        },
        error: () => {
          throw new Error('Unexpected error.');
        },
      });
    });

    it('should work with GET calls and 204 HTTP status', done => {
      const res = ajax({
        url: baseUrl + '/adhoc/',
        data: { status: 204 },
        success: (data, textStatus, xhr, ...rest) => {
          assert.equal(data, undefined);
          assert.equal(textStatus, 'nocontent');
          assert.equal(xhr, res);
          assert.equal(rest.length, 0);
          done();
        },
        error: () => {
          throw new Error('Unexpected error.');
        },
      });
    });
  });
};
