//= require_tree ../templates
//= require jquery
//= require jquery_ujs
//= require_tree .

$(function () {
  $("[data-container=main]").append(JST['form']);
  People();
  var create_form = $('.create-form');
  create_form.submit(function (event) {
    event.preventDefault();
    var inputs = ($(this).serializeArray());
    var formParams = {};
    $.each(inputs, function () {
      formParams[this.name] = this.value;
    });
    $.ajax({
      type: 'POST',
      url: '/api/people',
      dataType: 'json',
      data: JSON.stringify(formParams)
    }).done(function (response) {
      removeErrors(response, create_form);
      create_form.find("input[type=text], textarea").val('');
      People();
    })
      .fail(function (response) {
        var errorHtml = removeErrors(response, create_form);
        create_form.prepend('' +
          "<div class='error-messages'>" +
          "<ul>" +
          errorHtml +
          "</ul>" +
          "</div>");
        var errors = response.responseJSON.fields;
        for (var i = 0; i < errors.length; i++) {
          create_form.find("#" + errors[i]).addClass('field-with-errors');
        }
      });
  });
});


function removeErrors(response, form) {
  form.find('.error-messages').remove();
  form.find('#first_name, #last_name').removeClass('field-with-errors');
  var errorHtml = '';
  if (response.responseJSON !== undefined) {
    errorMessages = response.responseJSON.full_messages;
    for (var i = 0; i < errorMessages.length; i++) {
      errorHtml = errorHtml + "<li>" + errorMessages[i] + "</li>";
    }
  }
  return errorHtml;
}

function renderPeople(people) {
  $(".people").remove();
  $("[data-container=people]").append("<div class='people'></div>");
  $.each(people, function (index, person) {
    $(".people").append(JST['show_person'](person));
    $("[data-url='" + person.url + "']").click(function (event) {
      event.preventDefault();

      var edit_form_html = JST['edit_form'](person);
      var person_div = $("[data-url='" + person.url + "']").closest(".person");
      person_div.empty();
      person_div.append(edit_form_html);

      var edit_form = $("[data-url='" + person.url + "']").closest(".edit-form");
      edit_form.on("click", "#cancel", function (event) {
        event.preventDefault();
        People();
      });

      edit_form.on("click", "#delete", function (event) {
        event.preventDefault();
        $.ajax({
          type: 'DELETE',
          url: person.url
        }).done(function () {
          People();
        });
      });

      edit_form.submit(function (event) {
        event.preventDefault();
        var inputs = ($(this).serializeArray());
        var formParams = {};
        $.each(inputs, function () {
          formParams[this.name] = this.value;
        });
        $.ajax({
          type: 'PATCH',
          url: person.url,
          dataType: 'json',
          data: JSON.stringify(formParams)
        }).done(function () {
          People();
        })
          .fail(function (response) {
            var errorHtml = removeErrors(response, edit_form);
            edit_form.prepend('' +
              "<div class='error-messages'>" +
              "<ul>" +
              errorHtml +
              "</ul>" +
              "</div>");
            var errors = response.responseJSON.fields;
            for (var i = 0; i < errors.length; i++) {
              edit_form.find("#" + errors[i]).addClass('field-with-errors');
            }
          });
      });
    });
  });
}

function People() {
  var people = [];
  var i = 0;
  $.getJSON('/api/people').success(function (response) {
    $.each(response._embedded.people, function () {
      people[i] = new Person(
        this.first_name,
        this.last_name,
        this.address,
        this._links.self.href);
      i++;
    });
    renderPeople(people);
  });
}

function Person(firstName, lastName, address, url) {
  this.firstName = firstName;
  this.lastName = lastName;
  this.address = address;
  this.url = url;
}
